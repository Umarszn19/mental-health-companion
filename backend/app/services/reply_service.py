import re
from hashlib import sha256

SHORT_ACK_RE = re.compile(
    r"^(yes|yeah|yep|no|nope|ok|okay|sure|mm|mhm|uh huh|thanks|thank you|ty)\.?!*\]?$",
    re.IGNORECASE,
)

FAREWELL_RE = re.compile(
    r"^(?:(?:ok(?:ay)?|alright|well|thanks|thank you|nothing|not much)\s+)?"
    r"(bye|goodbye|bye bye|see you|talk later|gotta go|going now|logging off)"
    r"(?:\s+now)?[\s!.]*$",
    re.IGNORECASE,
)


def _variant_index(emotion: str, text: str, span: int) -> int:
    h = int(sha256(f"{emotion}:{text}".encode()).hexdigest(), 16)
    return h % span


def _mentions_physical(ctx: str) -> bool:
    keys = (
        "fell",
        "fall",
        "fallen",
        "falling",
        "knee",
        "leg",
        "arm",
        "head",
        "hurt",
        "hurts",
        "pain",
        "painful",
        "injury",
        "injured",
        "bike",
        "bicycle",
        "cycling",
        "road",
        "crash",
        "bleed",
        "bleeding",
        "hospital",
        "ambulance",
        "bone",
        "bruise",
        "stitches",
        "swollen",
        "swelling",
        "ankle",
        "wrist",
        "elbow",
        "shoulder",
        "hip",
    )
    return any(k in ctx for k in keys)


def _mentions_help_seeking(ctx: str) -> bool:
    return bool(
        re.search(
            r"\b(need help|further help|more help|get help|professional help|therapist|couns|councillor|"
            r"counselor|crisis|hotline|suicide|gp|doctor|a&e|emergency)\b",
            ctx,
            re.IGNORECASE,
        )
    )


def _mentions_immediate_risk(lower: str) -> bool:
    ctx = " ".join(str(lower or "").strip().split())
    if not ctx:
        return False

    direct_patterns = (
        r"\bsuicid(?:e|al)\b",
        r"\bkms\b",
        r"\bself[- ]?harm\b",
        r"\bhurt myself\b",
        r"\bkill myself\b",
        r"\bkill mysel[fv]\b",
        r"\bwant to die\b",
        r"\bend my life\b",
        r"\bdon'?t want to live\b",
        r"\bdo not want to live\b",
        r"\boverdose\b",
        r"\bcut(?:ting)? myself\b",
        r"\bkill (him|her|them|someone)\b",
        r"\bmurder\b",
        r"\bstab\b",
        r"\bshoot\b",
    )
    if any(re.search(p, ctx, re.IGNORECASE) for p in direct_patterns):
        return True

    dangerous_words = ("suicide", "suicidal", "kill", "murder", "overdose", "self-harm", "kms")
    return any(word in ctx for word in dangerous_words)


def _last_substantive_turn(recent: list[str], min_chars: int = 8) -> str | None:
    for msg in reversed(recent):
        s = msg.strip()
        if len(s) >= min_chars:
            return s
    return None


def _mentions_physical_harm(lower: str) -> bool:
    return bool(
        re.search(
            r"\b(slapped?|slapping|punch|punched|hit me|hits me|hitting|beaten|beating|"
            r"abusive|abuse|violence|violent|assault|attacked)\b",
            lower,
            re.IGNORECASE,
        )
    )


def _mentions_breakup(lower: str) -> bool:
    return bool(
        re.search(
            r"\b(break[\s-]?up|breakup|split(ting)? up|leave (him|her|them)|left (him|her|them)|"
            r"end(ing)? (the )?relationship|divorce|dumped)\b",
            lower,
            re.IGNORECASE,
        )
    )


def _mentions_relationship_stress(lower: str) -> bool:
    has_partner = bool(
        re.search(
            r"\b(girlfriend|boyfriend|partner|wife|husband|spouse|gf|bf)\b",
            lower,
            re.IGNORECASE,
        )
    )
    has_conflict = bool(
        re.search(
            r"\b(angry|mad|upset|annoyed|fight|argu|argument|ignore|ignoring|yell|shout)\b",
            lower,
            re.IGNORECASE,
        )
    )
    asks_advice = bool(re.search(r"\b(what should i|what do i|how (can|do) i|advice)\b", lower, re.IGNORECASE))
    return has_partner and (has_conflict or asks_advice)


def _looks_off_topic_query(lower: str) -> bool:
    has_question_shape = bool(re.search(r"\?$", lower.strip())) or bool(
        re.match(r"^(how|what|why|when|where|who|can you)\b", lower)
    )
    if not has_question_shape:
        return False

    if re.search(r"\b(risotto|recipe|cook|cooking|ingredients|bake|weather|movie|football|sport)\b", lower):
        return True

    wellbeing_topics = (
        r"\b(feel|feeling|emotion|mood|stress|stressed|anxious|anxiety|panic|sad|depress|"
        r"angry|lonely|overwhelmed|relationship|sleep|deadline|exam|coursework|burnout|help)\b"
    )
    return not bool(re.search(wellbeing_topics, lower))


def _try_contextual_reply(emotion: str, lower: str, t: str) -> str | None:
    s = t.strip()

    if re.search(
        r"\b(want|need|wish for|lack|build|gain|more) (?:self[- ]?)?confidence\b",
        lower,
    ) or re.search(r"\bconfidence in myself\b", lower) or re.search(
        r"\bfeel more confident\b",
        lower,
    ):
        return (
            "It sounds like you want to feel more confident in yourself, which is completely understandable. "
            "Confidence usually builds in small steps. Is there one area—study, social life, or work—where you want to start?"
        )

    if re.match(r"^(nothing|nothing much|not much|n/?a|idk)\.?!*$", lower) or (
        len(s) < 48 and re.search(r"^(i said )?nothing\b", lower)
    ):
        return (
            "That’s okay—sometimes there isn’t more to add. We can keep it light, pause, or take it slowly. "
            "What feels easiest right now?"
        )

    if re.search(
        r"\b(talk to me (?:nice|nicely)|speak (?:to me )?(?:nice|nicely|gently)|be nice|be kind|be gentle|"
        r"don'?t judge|no judgment|nicely\b.*\b(talk|speak)|please.*\b(gentle|kind))\b",
        lower,
    ):
        return (
            "I hear you. I’ll keep my tone gentle and respectful. "
            "What happened today that made you need that?"
        )

    if re.search(r"\b(i'?m|i am|im)\s+(hungry|starving)\b", lower) or re.search(r"\bhungry\b", lower):
        return (
            "That makes sense. Being hungry can make everything feel worse. "
            "If you can, grab some food and water first, then tell me what else is weighing on you."
        )

    if re.search(r"\b(i'?m|i am|im)\s+(thirsty|dehydrated)\b", lower) or re.search(r"\bthirsty\b", lower):
        return (
            "Thanks for saying that. If you can, drink some water first. "
            "Once you’ve had a moment, tell me what else is going on for you."
        )

    if re.search(r"\b(i'?m|i am|im)\s+(tired|exhausted|sleepy)\b", lower):
        return (
            "Got it. If you’re exhausted, your stress can feel much heavier than usual. "
            "Do you want to keep this brief and focus on one small next step for tonight?"
        )

    if re.search(r"\b(i'?m|i am|im)\s+(ill|sick|unwell|dizzy|nauseous)\b", lower):
        return (
            "Sorry you’re feeling unwell. Your body comes first here. "
            "If symptoms feel severe or are getting worse, please contact NHS 111 or a clinician."
        )

    if re.search(
        r"\b(i'?m|i am|im|feeling) (?:really |so |very )?(sad|down|low|depressed|blue|empty|hopeless|miserable)\b",
        lower,
    ) or re.search(r"\bi feel (?:really |so |very )?(sad|down|terrible|awful|numb)\b", lower):
        return (
            "I’m sorry you’re feeling like this—it sounds really heavy. "
            "If you want to share more, is this about today, or has it been building up?"
        )

    if len(s) < 90 and re.match(r"^(thanks|thank you|ty|thx|appreciate it)\b", lower):
        return "You’re welcome. What feels most important to talk about next?"

    if re.search(r"\bi love\b", lower) and len(s) < 200:
        return (
            "Thanks for saying that. It sounds important to you. "
            "Do you want to talk about how it makes you feel, or about what happened?"
        )

    if re.search(
        r"\b(can'?t cope|stressed|overwhelmed|too much|panic(king)?|anxious|worried sick|burnout)\b",
        lower,
    ):
        return (
            "That sounds overwhelming. Let’s keep it simple—what is the one thing stressing you most right now?"
        )

    if re.search(r"\b(lonely|alone|no one cares|nobody (?:gets|understands) me|isolated)\b", lower):
        return (
            "Feeling lonely can hurt even when people are around. "
            "What are you missing most right now: being heard, being understood, or not feeling alone?"
        )

    if len(s) <= 72 and re.match(
        r"^(hi+|hello|hey|yo|hiya|good\s+(morning|afternoon|evening))(?:\s+there)?[!.,\s]*$",
        lower,
    ):
        return (
            "Hi, thanks for saying hello. I’m here with you. What would you like to share today?"
        )

    if re.search(r"\b(are you (?:a )?(?:real|human|person|bot)|is anyone there|can you hear me)\b", lower):
        return (
            "I’m an automated support companion, not a human therapist. "
            "I still take what you say seriously. What’s on your mind right now?"
        )

    if (
        emotion == "joy"
        and len(s) < 120
        and not re.search(r"\b(but|however|worried|scared|confidence)\b", lower)
    ):
        return "I’m glad something positive came through. What part of it do you want to explore a little more?"

    return None


def _low_confidence_reply(lower: str, model_confidence: float) -> str | None:
    if model_confidence >= 0.22:
        return None
    word_count = len([w for w in lower.split() if w.strip()])
    if word_count > 5:
        return None
    return (
        "I don’t want to guess from a very short message. Could you share one more line so I can respond better?"
    )


def _extract_focus_phrase(text: str) -> str | None:
    s = " ".join(text.strip().split())
    if not s:
        return None
    parts = [p.strip(" .!?") for p in re.split(r"[.!?]+", s) if p.strip()]
    if not parts:
        return s[:120]
    best = max(parts, key=len)
    return best[:140]


def _build_conversational_reply(emotion: str, text: str, recent_user: list[str]) -> str | None:
    focus = _extract_focus_phrase(text)
    if not focus or len(focus) < 10:
        return None

    lower = text.lower()
    if len(lower.split()) <= 4:
        return None

    opener = "Thanks for sharing that."
    if emotion == "sadness":
        opener = "That sounds tough."
    elif emotion == "fear":
        opener = "That sounds stressful."
    elif emotion == "anger":
        opener = "I can hear how frustrating this is."
    elif emotion == "joy":
        opener = "I can hear a positive note in that."

    if re.search(r"\b(what should i|what do i do|how do i|advice)\b", lower):
        follow_up = "If you want, we can break this into one step for now and one for later."
        question = "What feels like the hardest part to act on right now?"
    elif re.search(r"\b(can't|cannot|stuck|overwhelmed|too much|panic|anxious|worried)\b", lower):
        follow_up = "We can keep this simple and focus on what helps in the next hour."
        question = "What is the one thing making this feel biggest right now?"
    elif re.search(r"\b(relationship|partner|girlfriend|boyfriend|argue|argument|fight)\b", lower):
        follow_up = "Relationship stress can make it hard to see whether you need repair, distance, or clarity."
        question = "Do you want to be heard, set a boundary, or decide your next move?"
    else:
        follow_up = "I’m here to work through this with you, one step at a time."
        question = "What would help most right now—listening, sorting thoughts, or practical ideas?"
    return f"{opener} {follow_up} {question}"


def compose_reply(emotion: str, text: str, recent_user: list[str], model_confidence: float = 1.0) -> str:
    t = text.strip()
    lower = t.lower()
    recent = [x.strip() for x in recent_user if x and x.strip()]

    if _mentions_immediate_risk(lower):
        return (
            "I’m really glad you told me this. Your safety matters most right now. "
            "I can’t provide crisis care, so please contact professional support now: "
            "call emergency services (999) if there is immediate danger, or NHS 111 for urgent help. "
            "If possible, tell a trusted person near you right away and do not stay alone."
        )

    # Help-seeking must match the *current* message only. Matching against concatenated
    # recent turns caused repeated signposting when an older turn contained words like
    # "doctor", "crisis", or "GP" while the user had moved on to a normal check-in.
    if _mentions_help_seeking(lower):
        return (
            "Thank you for saying you want more support. I'm not a clinician and "
            "can't replace a counsellor or doctor, but I can listen. If you might be in danger or in "
            "crisis, please contact local emergency services or a crisis line right away. "
            "Otherwise, would it help to talk through what “more help” would look like for you "
            "(e.g. speaking to your GP, student services, or a trusted person)?"
        )

    if FAREWELL_RE.match(t.strip()):
        return (
            "Take care, and thanks for chatting today. If things feel heavy later, reaching out to someone "
            "you trust or a professional is always a valid option."
        )

    if _looks_off_topic_query(lower):
        return (
            "I’m mainly built for wellbeing check-ins rather than general questions. "
            "If you want, tell me how your day is going or how you’ve been feeling."
        )

    contextual = _try_contextual_reply(emotion, lower, t)
    if contextual is not None:
        return contextual

    short_state_match = re.match(r"^(i'?m|i am|im)\s+([a-z][a-z\s-]{1,20})[.!?]*$", lower)
    if short_state_match and len(t.split()) <= 5:
        state = short_state_match.group(2).strip()
        return (
            f"Thanks for sharing that you’re {state}. "
            "Would you like a quick practical suggestion, or do you want to talk a bit more about it?"
        )

    low = _low_confidence_reply(lower, model_confidence)
    if low is not None:
        return low

    if len(t) < 24 and SHORT_ACK_RE.match(t.strip()):
        prior = _last_substantive_turn(recent)
        if prior:
            clip = prior if len(prior) <= 140 else prior[:137] + "…"
            return (
                f"Thanks for letting me know. I’m still thinking about what you said: “{clip}” "
                f"What would you like to add about that—anything that changed since then?"
            )
        return (
            "Thanks—I’m with you. Could you say a bit more in your own words so I can respond in a "
            "way that fits what you mean?"
        )

    if _mentions_physical_harm(lower):
        return (
            "I’m really sorry that happened. Being hit or slapped is not okay, and it’s understandable "
            "you’d feel shaken or angry. If you’re in immediate danger, please contact emergency "
            "services or a local crisis line. You deserve to be safe; reaching out to someone you trust "
            "(a friend, family, GP, or student support) can be an important next step. "
            "What do you feel you need most right now—safety, space, or someone to talk to?"
        )

    if _mentions_breakup(lower):
        vi = _variant_index("breakup", t, 2)
        if vi == 0:
            return (
                "Wanting a breakup after conflict can bring relief, guilt, or both—and that’s a lot to "
                "carry. What feels true for you: is this about protecting yourself, or mainly reacting "
                "in the heat of the moment?"
            )
        return (
            "Ending a relationship is a big decision. If it helps, we could separate two things: what "
            "hurt in the last few days, and what you’d want from a relationship in general. "
            "Which of those feels clearer to you right now?"
        )

    if _mentions_relationship_stress(lower):
        vi = _variant_index("rel", t, 3)
        rel_replies = (
            (
                "It sounds tense with your partner right now—that can be really draining. "
                "When you picture talking to them, are you hoping to repair things, set a boundary, "
                "or mainly understand what went wrong?"
            ),
            (
                "Arguments in relationships often pile up small frustrations. "
                "What triggered this latest clash—was it one moment, or things that have been building?"
            ),
            (
                "Thanks for spelling that out. If you want something practical: one calm sentence you "
                "could use is “I felt hurt when ___, and I need ___.” Does that feel doable, or does "
                "it feel too risky right now?"
            ),
        )
        return rel_replies[vi]

    if _mentions_physical(lower):
        if "knee" in lower:
            return (
                "That sounds really sore—I’m sorry about your knee. If it’s very painful, you can’t "
                "put weight on it, or it’s swelling badly, it’s sensible to get it checked (pharmacist, "
                "NHS 111, or urgent care/A&E if it feels severe). "
                "Apart from the pain, what’s worrying you most—the injury itself or the shock of the fall?"
            )
        if ("bike" in lower or "bicycle" in lower or "cycling" in lower) and any(
            w in lower for w in ("fell", "fall", "fallen", "falling", "crash", "come off", "coming off")
        ):
            return (
                "Coming off a bike can shake you up even when injuries seem small. "
                "How are you feeling now—physically, and in your head after it happened? "
                "If anything feels off (bad pain, dizziness, hit to the head), please err on the side "
                "of getting medical advice."
            )
        return (
            "I’m sorry you’re dealing with that—it sounds painful. Are you in a safe place now? "
            "If symptoms are severe or getting worse, please reach out to NHS 111 / a clinician / "
            "emergency services as appropriate. "
            "What happened most recently with the injury—has anything made it better or worse?"
        )

    conversational = _build_conversational_reply(emotion, t, recent)
    if conversational is not None:
        return conversational

    vi = _variant_index(emotion, t, 4)
    if emotion == "sadness":
        sadness_opts = (
            (
                "I hear a lot of weight in what you shared. What part of it has been hardest today, "
                "and is there one small thing that might make the next hour a little easier?"
            ),
            (
                "Thank you for trusting me with that—it sounds really tough. "
                "Would it help to unpack what happened step by step, or what you wish had gone differently?"
            ),
            (
                "That sounds painful to sit with. When you think about the next day or two, is there "
                "one person, place, or routine that might give you even a little stability?"
            ),
            (
                "I’m glad you said it out loud—sometimes naming it already takes courage. "
                "Is the sadness mostly about something that happened, or about what you’re afraid might happen next?"
            ),
        )
        return sadness_opts[vi % 4]
    if emotion == "fear":
        fear_opts = (
            (
                "That sounds really intense. If you’re safe right now, what feels most worrying—"
                "the situation itself, or how you’re reacting to it?"
            ),
            (
                "Let’s slow this down for a moment. What’s the next small step that feels manageable, "
                "even if everything else feels big?"
            ),
            (
                "Fear can make everything feel urgent at once. If you had to pick one thing to stabilise "
                "first (sleep, food, talking to someone, or leaving a situation), what would it be?"
            ),
            (
                "Thanks for saying this. Sometimes naming the fear out loud already shrinks it a bit. "
                "What’s the worst outcome you’re imagining—and is there any smaller worry underneath that?"
            ),
        )
        return fear_opts[vi % 4]
    if emotion == "anger":
        anger_opts = (
            (
                "It makes sense you’d feel strongly about that. What felt most unfair or frustrating to you—"
                "and what would you want to happen next, if anything were possible?"
            ),
            (
                "Anger often shows up when something important feels disrespected. "
                "What boundary or value feels crossed for you in this situation?"
            ),
            (
                "That sounds really maddening. If you imagine the conversation you’d want to have, "
                "would the goal be to be heard, to fix things, or to protect yourself?"
            ),
            (
                "Thanks for being honest about the heat you’re feeling. "
                "Is the anger mostly at a person, at yourself, or at the situation you’re stuck in?"
            ),
        )
        return anger_opts[vi % 4]
    if emotion == "joy":
        joy_opts = (
            (
                "I’m glad something positive came through in your message. What do you think contributed "
                "to that—was it something you did, someone else, or a bit of both?"
            ),
            (
                "That’s good to hear. Is this a moment you want to build on—and if so, what would ‘one "
                "small next step’ look like?"
            ),
            (
                "Nice—thanks for sharing that bright spot. What made the difference today compared to a "
                "rougher day?"
            ),
            (
                "I can hear a bit of lift in what you wrote. Who or what helped you feel even slightly better?"
            ),
        )
        return joy_opts[vi % 4]
    if emotion == "surprise":
        sur_opts = (
            (
                "That does sound unexpected. What surprised you most—the event itself, or how you felt "
                "afterwards?"
            ),
            (
                "Wow—that’s a lot to process suddenly. What’s your gut saying: do you need time to think, "
                "or someone to talk it through with?"
            ),
            (
                "Unexpected news can throw your whole day off. What’s the first thing you’re trying to "
                "figure out about it?"
            ),
            (
                "Thanks for walking me through it. If you could ask one clarifying question about what "
                "happened, what would it be?"
            ),
        )
        return sur_opts[vi % 4]
    if emotion == "disgust":
        dis_opts = (
            (
                "That sounds really unpleasant to go through. What part of it sits with you the most right now?"
            ),
            (
                "I’m sorry you had to deal with something that feels that off-putting. "
                "Do you need practical next steps, or mainly space to vent?"
            ),
            (
                "That sounds deeply uncomfortable. Is it more about what happened, or how people responded?"
            ),
            (
                "Thanks for saying it plainly—some situations just feel wrong. "
                "What would ‘feeling okay again’ look like in small terms?"
            ),
        )
        return dis_opts[vi % 4]

    neu_opts = (
        (
            "Thanks for sharing. What would be most helpful next—talking through what happened, "
            "or how you’re feeling about it now?"
        ),
        (
            "I’m listening. Is there a detail you haven’t said yet that might help me understand your "
            "situation better?"
        ),
        (
            "Thanks—that helps me picture it a bit more. What’s the main thing you’re hoping for from "
            "this conversation?"
        ),
        (
            "Got it. If you zoom in on the next few hours, what would make things even slightly easier?"
        ),
    )
    return neu_opts[vi % 4]

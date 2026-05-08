import React, { useState } from 'react';
import styles from '../myCSS/Login.module.css';
import { Link, useNavigate } from 'react-router-dom';


const LoginPage = () => {
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        'email': '',
        'password': ''
    })

    const [errorMessage, setErrorMessage] = useState({})
    const [successMessage, setSuccessMessage] = useState("")

    const handleChange = (e) => {
        const name = e.target.name
        const value = e.target.value

        setFormData({
            ...formData,
            [name]: value
        })

        setErrorMessage({
            ...errorMessage,
            [name]: ""
        })

    }

    const handleLogin = () => {
        const errors = {}
        
        const emailRegex = /^[\w\.]+@(gmail|yahoo)\.com$/;
        const isValidEmail = emailRegex.test(formData.email);
        
        if (!isValidEmail) {
            errors.email = 'Please enter a valid email address'
        }
        if (formData.password === '') { 
            errors.password = 'Password cannot be empty' 
        }
        
        if(Object.keys(errors).length === 0) {
            const savedUsers = JSON.parse(localStorage.getItem('myAppUsers')) || {}

            if (savedUsers[formData.email] && savedUsers[formData.email].password === formData.password){
                localStorage.setItem('activeUser', formData.email)

                navigate('/home')
                setSuccessMessage('Login Successful')
            } else {  
            errors.login = 'Invalid email or password'
            
            }
        } 
        setErrorMessage(errors)
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.leftPanel}>
                <span className={styles.badge}>Open Room</span>
                <h1 className={styles.leftTitle}>Reflect better, one chat at a time.</h1>
                <p className={styles.leftCopy}>
                    Track your emotional patterns from natural conversation. No manual diary needed.
                </p>
                <div className={styles.featureGrid}>
                    <div className={styles.featureCard}>
                        <p className={styles.featureTitle}>Mood Trend</p>
                        <p className={styles.featureText}>Each message updates your wellbeing line automatically.</p>
                    </div>
                    <div className={styles.featureCard}>
                        <p className={styles.featureTitle}>Bounded Support</p>
                        <p className={styles.featureText}>Non-clinical, confidence-aware responses for safer guidance.</p>
                    </div>
                </div>
            </div>

            <div className={styles.rightPanel}>
                <div className={styles.loginCard}>
                    <p className={styles.logoText}>Open Room</p>
                    <h2 className={styles.heading}>Welcome back</h2>
                    <p className={styles.subtitle}>Sign in to continue your check-ins and mood timeline.</p>
                    <p className={styles.switchLink}>Don't have an account? <Link to='/createAccount'>Create one</Link></p>

                    <p>Email:</p>
                    
                    <input 
                    name='email'
                    value={formData.email}
                    className={styles.inputField}
                    type="text"
                    placeholder='e.g abc@gmail.com' 
                    onChange={handleChange}
                    />
                    <label className={styles.errorText} >{errorMessage.email}</label>

                    <p>Password:</p>

                    <input 
                    name='password'
                    value={formData.password}
                    className={styles.inputField} 
                    type="password" 
                    placeholder='enter password' 
                    onChange={handleChange}
                    /> 
                    <label className={styles.errorText}>{errorMessage.password}</label>

                    <button 
                    onClick={handleLogin}
                    className={styles.signInButton}
                    >Login</button>
                    {successMessage && (
                        <label style={{color: 'green'}}>{successMessage}</label>
                    )}

                    {errorMessage.login && (
                        <label className={styles.errorText}>{errorMessage.login}</label>
                    )}
                </div>
            </div>
        </div>
       

    );
}

export default LoginPage;
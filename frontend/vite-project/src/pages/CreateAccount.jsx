import React, { useState } from 'react';
import styles from '../myCSS/CreateAcc.module.css';
import { useNavigate, Link } from 'react-router-dom';

const CreateAccount = () => {

    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        'firstname': '',
        'surname': '', 
        'email': '',
        'password': '',
        'confirmPassword': ''
    })

    const [errorMessage, setErrorMessage] = useState({})
    const [successMessage, setSuccessMessage] = useState("")

    const HandleChange = (e) => {
        const value = e.target.value
        const name = e.target.name

        setFormData({
            ...formData, 
            [name]:value
        })

        setErrorMessage({
            ...errorMessage,
            [name]: ""
        })
    }


    const HandleSubmit = () => {
        const errors = {}

        const emailRegex = /^[\w\.]+@(gmail|yahoo)\.com$/
        const isValidEmail = emailRegex.test(formData.email)

        const passwordRegex = /^(?=.*\d)(?=.*[A-Z]).{8,}$/
        const isValidPassword = passwordRegex.test(formData.password)

        const isValidConfirmPassword = formData.password != "" && formData.password === formData.confirmPassword
        
        if (formData.firstname === "") {
            errors.firstname = 'Firstname cannot be empty'
        } 
        
        if (formData.surname === "") {
            errors.surname = 'Surname cannot be empty'
        }

        if (!isValidEmail) {
            errors.email = 'Pleae enter a valid email address'
        }

        if (!isValidPassword) {
            errors.password = "Password must be of minimum length 8 and contain atleast one number and capital letter"
        } 


        if (!isValidConfirmPassword)  {
            errors.confirmPassword = 'Passwords must match and cannot be empty'
        }

        setErrorMessage(errors)

        const savedUsers = JSON.parse(localStorage.getItem('myAppUsers')) || {}


        if (Object.keys(errors).length === 0) {
            savedUsers[formData.email] = formData 

            localStorage.setItem('myAppUsers', JSON.stringify(savedUsers))

            navigate('/')
            setSuccessMessage('Account created successfully')
        } else{
            setSuccessMessage('')
        }
    }
   
    return (
    <div className={styles.wrapper}>
        <div className={styles.leftPanel}>
            <span className={styles.badge}>Create your space</span>
            <h1 className={styles.leftTitle}>Set up Open Room.</h1>
            <p className={styles.leftCopy}>
                Your account keeps your chat insights and mood trend connected across sessions.
            </p>
        </div>
        <div className={styles.rightPanel}>
        <div className={styles.wrapperContainer}>
            <div>
                <h1><b>Create Account</b></h1>
                <p>Already have an account?  <Link to="/">Sign in</Link></p>
            </div>
            <div>
                <p>Firstname:</p>
                <input 
                className={styles.inputField} 
                name = 'firstname'
                value={formData.firstname}
                onChange={HandleChange}
                type="text" placeholder='Enter firstname'/>
                <p className={styles.errorText}>{errorMessage.firstname}</p>
                
                <p>Surname:</p>
                <input 
                name='surname'
                value={formData.surname}
                onChange={HandleChange}
                className={styles.inputField} 
                type="text" placeholder='Enter surnname'/> 
                <p className={styles.errorText}>{errorMessage.surname}</p>

                <p>Email:</p>
                <input
                name='email'
                value={formData.email}
                onChange={HandleChange}
                className={styles.inputField} type="text" placeholder='Enter email address'/> 
                <p className={styles.errorText}>{errorMessage.email}</p>
                
                <p>Date Of Birth</p>
                <input className={styles.inputField} type="date" />

                <p>Password:</p>
                <input
                name='password' 
                value={formData.password}  
                onChange={HandleChange}
                className={styles.inputField} type="password" placeholder='Enter password'/>
                <p className={styles.errorText}>{errorMessage.password}</p>

                <p>Confirm password:</p>
                <input 
                name='confirmPassword'
                value={formData.confirmPassword}
                onChange={HandleChange}
                className={styles.inputField} type="password" placeholder='Re-enter password' />
                <p className={styles.errorText}>{errorMessage.confirmPassword}</p>

                <p><button 
                onClick={HandleSubmit}
                className={styles.createButton}>Create Account</button></p>
                <p>{successMessage}</p>

        
            </div>
        </div>
        </div>

    </div>

    );
    }


export default CreateAccount;
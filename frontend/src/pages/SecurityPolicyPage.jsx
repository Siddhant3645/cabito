import React from 'react';
import './LegalPages.css';

function SecurityPolicyPage() {
    return (
        <div className="App-container">
            <div className="legal-container">
                <h1>Security Policy</h1>
                <p><strong>Last Updated:</strong> July 17, 2025</p>
                
                <h2>Our Commitment</h2>
                <p>At Cabito, the security of your data is a top priority. We employ a range of security measures to protect your information from unauthorized access, use, or disclosure.</p>

                <h2>Account Security</h2>
                <ul>
                    <li>
                        <strong>Password Protection:</strong> We never store your password in plain text. All passwords are put through a strong, one-way hashing algorithm (bcrypt) before being stored in our database.
                    </li>
                    <li>
                        <strong>User Responsibility:</strong> You are responsible for keeping your password confidential. We recommend using a long, unique password that you do not use for any other service.
                    </li>
                </ul>

                <h2>Data Transmission</h2>
                <p>
                    All data transmitted between your browser and our servers is encrypted using industry-standard Transport Layer Security (TLS), also known as HTTPS. This ensures that your information is protected from eavesdropping.
                </p>

                <h2>Authentication</h2>
                <p>
                    We use a modern authentication system based on JSON Web Tokens (JWTs). Short-lived access tokens are used for API requests, while a long-lived refresh token is stored securely in an `HttpOnly` cookie to maintain your session without exposing it to client-side scripts.
                </p>

                <h2>Vulnerability Reporting</h2>
                <p>
                    If you believe you have found a security vulnerability in our Service, we encourage you to report it to us immediately. Please contact us at <a href="mailto:security@cabito.co.in">security@cabito.co.in</a> with the details. We appreciate your help in keeping Cabito secure.
                </p>
            </div>
        </div>
    );
}

export default SecurityPolicyPage;
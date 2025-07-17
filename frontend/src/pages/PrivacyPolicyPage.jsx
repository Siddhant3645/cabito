import React from 'react';
import './LegalPages.css';

function PrivacyPolicyPage() {
    return (
        <div className="App-container">
            <div className="legal-container">
                <h1>Privacy Policy</h1>
                <p><strong>Last Updated:</strong> July 17, 2025</p>

                <h2>1. Introduction</h2>
                <p>
                    Welcome to Cabito ("we," "our," "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services (the "Service"). Please read this policy carefully.
                </p>

                <h2>2. Information We Collect</h2>
                <p>We may collect information about you in a variety of ways. The information we may collect on the Service includes:</p>
                <ul>
                    <li>
                        <strong>Account Information:</strong> When you register for an account, we collect your email address and a securely hashed version of your password.
                    </li>
                    <li>
                        <strong>Itinerary Planning Data:</strong> To generate your travel plans, we collect the inputs you provide, such as your start/end locations (either as text or as geographic coordinates), selected dates and times, budget, travel preferences, and any custom descriptions you write.
                    </li>
                    <li>
                        <strong>Usage Data:</strong> We automatically collect information when you access the Service, such as your IP address (for security purposes like rate limiting), browser type, and operating system.
                    </li>
                    <li>
                        <strong>Cookies:</strong> We use cookies to manage your session. Specifically, we use an `HttpOnly` cookie to store your refresh token, which keeps you logged in securely.
                    </li>
                </ul>

                <h2>3. How We Use Your Information</h2>
                <p>We use the information we collect to:</p>
                <ul>
                    <li>Create and manage your account.</li>
                    <li>Provide, operate, and maintain our core Service of generating itineraries.</li>
                    <li>Communicate with you, including responding to your support requests.</li>
                    <li>Improve our Service by analyzing usage patterns (typically with anonymized or aggregated data).</li>
                    <li>Protect against fraud and abuse, and ensure the security of our platform.</li>
                </ul>

                <h2>4. AI and Data Processing</h2>
                <p>
                    A core feature of Cabito is the use of artificial intelligence (AI) to generate itineraries and insights. When you provide inputs like a custom trip description or request an itinerary, this information is processed by our AI models (including third-party models like Google's Gemini) to create a relevant response. We do not use this data to personally identify you to the AI model beyond what is necessary to generate the plan.
                </p>

                <h2>5. Third-Party Services</h2>
                <p>To provide our Service, we rely on third-party services. This may involve sharing some of your data with them:</p>
                <ul>
                    <li>
                        <strong>Mapping & Location Services (e.g., HERE API, Nominatim):</strong> Location names or coordinates are sent to these services to get map data, directions, and place details.
                    </li>
                    <li>
                        **AI Services (e.g., Google Gemini):** Your text inputs and preferences are sent for processing to generate creative and relevant travel plans.
                    </li>
                </ul>
                <p>We encourage you to review the privacy policies of these third-party services.</p>

                <h2>6. Data Security</h2>
                <p>
                    We use administrative, technical, and physical security measures to help protect your personal information. Please see our <a href="/security-policy">Security Policy</a> for more details.
                </p>

                <h2>7. Your Data Rights</h2>
                <p>
                    You have the right to access and update your account information. You also have the right to delete your account. This can be done from your Account page. Account deletion will permanently remove your personal data in accordance with our data retention policies.
                </p>

                <h2>8. Contact Us</h2>
                <p>
                    If you have questions or comments about this Privacy Policy, please contact us at: <a href="mailto:support@cabito.co.in">support@cabito.co.in</a>.
                </p>
            </div>
        </div>
    );
}

export default PrivacyPolicyPage;
/**
 * Beautiful HTML Email Templates for ThinkCode
 */

const welcomeEmail = (username) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Welcome to ThinkCode</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', Arial, sans-serif; background: #0B0E14; color: #f0f6fc; }
    </style>
</head>
<body>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0E14; padding: 40px 16px; min-height:100vh;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: #161B22; border-radius: 20px; overflow: hidden; border: 1px solid #30363D; box-shadow: 0 24px 64px rgba(0,0,0,0.5);">
                    
                    <!-- Header Banner -->
                    <tr>
                        <td align="center" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 48px 40px 36px;">
                            <!-- Logo -->
                            <table cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <table cellpadding="0" cellspacing="0" align="center">
                                            <tr>
                                                <td style="background: rgba(255,255,255,0.15); border-radius: 16px; padding: 12px 18px; border: 1px solid rgba(255,255,255,0.2);">
                                                    <span style="font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -0.5px;">Think<span style="opacity:0.75">Code</span></span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <div style="margin-top: 28px;">
                                <!-- Trophy icon using text -->
                                <div style="font-size: 52px; line-height:1; margin-bottom: 16px;">🎉</div>
                                <h1 style="font-size: 30px; font-weight: 800; color: #fff; letter-spacing: -0.5px; line-height: 1.2; margin: 0;">
                                    Congratulations!
                                </h1>
                                <p style="font-size: 17px; color: rgba(255,255,255,0.8); margin-top: 8px; font-weight: 400;">
                                    You've successfully joined ThinkCode
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 36px 40px 24px;">
                            <p style="font-size: 16px; color: #8B949E; line-height: 1; margin-bottom: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Hey there,</p>
                            <h2 style="font-size: 26px; font-weight: 800; color: #F0F6FC; margin-bottom: 16px; letter-spacing: -0.3px;">
                                Welcome, ${username}! 👋
                            </h2>
                            <p style="font-size: 15px; color: #8B949E; line-height: 1.7; margin-bottom: 28px;">
                                Your ThinkCode account has been <strong style="color: #3FB950;">successfully created</strong>. 
                                You're now part of a community of developers who code, compete, and grow together.
                            </p>
                            
                            <!-- Feature Cards -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">

                                <tr>
                                    <td style="padding: 14px 16px; background: #0D1117; border-radius: 12px; border: 1px solid #30363D; margin-bottom: 10px; display: block;">
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <span style="font-size: 20px;">💡</span>
                                            <div>
                                                <p style="font-size: 14px; font-weight: 700; color: #F0F6FC; margin:0;">Solve Coding Problems</p>
                                                <p style="font-size: 12px; color: #8B949E; margin: 2px 0 0;">Tackle challenges from Easy to Hard with AI hints</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <tr><td style="height: 8px;"></td></tr>
                                <tr>
                                    <td style="padding: 14px 16px; background: #0D1117; border-radius: 12px; border: 1px solid #30363D;">
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <span style="font-size: 20px;">🤖</span>
                                            <div>
                                                <p style="font-size: 14px; font-weight: 700; color: #F0F6FC; margin: 0;">AI Mentor & Auto-Grading</p>
                                                <p style="font-size: 12px; color: #8B949E; margin: 2px 0 0;">Get surgical feedback and instant performance grades</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <tr><td style="height: 8px;"></td></tr>
                                <tr>
                                    <td style="padding: 14px 16px; background: #0D1117; border-radius: 12px; border: 1px solid #30363D;">
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <span style="font-size: 20px;">🏆</span>
                                            <div>
                                                <p style="font-size: 14px; font-weight: 700; color: #F0F6FC; margin: 0;">Track Your Progress</p>
                                                <p style="font-size: 12px; color: #8B949E; margin: 2px 0 0;">Monitor submissions, streaks and improvement over time</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                            </table>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="http://localhost:4200/login"
                                           style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 40px; border-radius: 12px; letter-spacing: 0.02em; box-shadow: 0 8px 24px rgba(99,102,241,0.35);">
                                            🚀 &nbsp; Start Coding Now
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="height: 1px; background: #30363D;"></div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px 32px; text-align: center;">
                            <p style="font-size: 13px; color: #4B5563; line-height: 1.6;">
                                This email was sent to you because you registered on ThinkCode.<br/>
                                If you didn't register, you can safely ignore this email.
                            </p>
                            <p style="font-size: 12px; color: #374151; margin-top: 12px;">
                                © ${new Date().getFullYear()} ThinkCode. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
};

const verificationEmail = (username, verifyUrl) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Verify Your Email - ThinkCode</title>
</head>
<body style="margin:0; padding:0; background:#0B0E14; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0E14; padding: 40px 16px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: #161B22; border-radius: 20px; overflow: hidden; border: 1px solid #30363D;">
                    
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 32px;">
                            <div style="font-size: 40px; margin-bottom: 12px;">📧</div>
                            <h1 style="font-size: 26px; font-weight: 800; color: #fff; margin: 0;">Verify Your Email</h1>
                            <p style="font-size: 15px; color: rgba(255,255,255,0.75); margin: 8px 0 0;">One last step to get started</p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 32px;">
                            <p style="font-size: 15px; color: #F0F6FC; margin-bottom: 8px;">Hey <strong>${username}</strong>,</p>
                            <p style="font-size: 15px; color: #8B949E; line-height: 1.7; margin-bottom: 28px;">
                                Thanks for signing up! Click the button below to verify your email address and activate your ThinkCode account.
                            </p>
                            
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="${verifyUrl}"
                                           style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 12px;">
                                            ✅ &nbsp; Verify My Email
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="font-size: 13px; color: #4B5563; margin-top: 24px; text-align: center; line-height: 1.6;">
                                This link expires in 24 hours. If you didn't create an account, ignore this email.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 16px 32px 28px; text-align: center; border-top: 1px solid #30363D;">
                            <p style="font-size: 12px; color: #374151;">© ${new Date().getFullYear()} ThinkCode — Happy Coding!</p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
};

module.exports = { welcomeEmail, verificationEmail };

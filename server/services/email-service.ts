import nodemailer from "nodemailer";

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailTemplateData {
  userName?: string;
  userEmail?: string;
  projectName?: string;
  reportTitle?: string;
  actionUrl?: string;
  planName?: string;
  amount?: string;
  expiryDate?: string;
  language?: "en" | "ar";
}

const getEmailConfig = (): EmailConfig => ({
  host: process.env.SMTP_HOST || "mail.privateemail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true,
  user: process.env.SMTP_USER || "",
  password: process.env.SMTP_PASSWORD || "",
  fromEmail: process.env.SMTP_FROM_EMAIL || "noreply@inferaengine.com",
  fromName: "INFERA Vision",
});

const createTransporter = () => {
  const config = getEmailConfig();
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
};

const getBaseStyles = () => `
  body { 
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
    line-height: 1.6; 
    color: #333; 
    margin: 0; 
    padding: 0; 
    background-color: #f4f7fa; 
  }
  .container { 
    max-width: 600px; 
    margin: 0 auto; 
    padding: 20px; 
  }
  .header { 
    background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); 
    padding: 30px 20px; 
    text-align: center; 
    border-radius: 12px 12px 0 0;
  }
  .header h1 { 
    color: #fff; 
    margin: 0; 
    font-size: 28px;
    font-weight: 600;
  }
  .header .subtitle {
    color: rgba(255,255,255,0.8);
    font-size: 14px;
    margin-top: 5px;
  }
  .content { 
    background: #fff; 
    padding: 40px 30px; 
    border-radius: 0 0 12px 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }
  .greeting {
    font-size: 18px;
    color: #1e3a5f;
    margin-bottom: 20px;
  }
  .message {
    color: #555;
    font-size: 15px;
    margin-bottom: 25px;
  }
  .button { 
    display: inline-block; 
    padding: 14px 32px; 
    background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); 
    color: #fff !important; 
    text-decoration: none; 
    border-radius: 8px; 
    font-weight: 600;
    font-size: 15px;
    margin: 20px 0;
    transition: transform 0.2s;
  }
  .button:hover {
    transform: translateY(-2px);
  }
  .info-box {
    background: #f8fafc;
    border-left: 4px solid #1e3a5f;
    padding: 20px;
    margin: 25px 0;
    border-radius: 0 8px 8px 0;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
  }
  .info-row:last-child {
    border-bottom: none;
  }
  .info-label {
    color: #666;
    font-size: 14px;
  }
  .info-value {
    color: #1e3a5f;
    font-weight: 600;
    font-size: 14px;
  }
  .footer { 
    text-align: center; 
    padding: 25px 20px;
    color: #888;
    font-size: 12px;
  }
  .footer a {
    color: #1e3a5f;
    text-decoration: none;
  }
  .social-links {
    margin: 15px 0;
  }
  .social-links a {
    display: inline-block;
    margin: 0 8px;
    color: #666;
  }
  .divider {
    height: 1px;
    background: #eee;
    margin: 30px 0;
  }
  .rtl { direction: rtl; text-align: right; }
`;

const getEmailTemplate = (content: string, isRtl: boolean = false) => `
<!DOCTYPE html>
<html lang="${isRtl ? 'ar' : 'en'}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>INFERA Vision</title>
  <style>${getBaseStyles()}</style>
</head>
<body>
  <div class="container ${isRtl ? 'rtl' : ''}">
    <div class="header">
      <h1>INFERA Vision</h1>
      <div class="subtitle">${isRtl ? 'منصة دراسات الجدوى بالذكاء الاصطناعي' : 'AI-Powered Feasibility Studies'}</div>
    </div>
    ${content}
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} INFERA Vision. ${isRtl ? 'جميع الحقوق محفوظة' : 'All rights reserved.'}</p>
      <p>
        <a href="https://inferaengine.com">${isRtl ? 'زيارة الموقع' : 'Visit Website'}</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

export const emailTemplates = {
  welcomeEmail: (data: EmailTemplateData): { subject: string; html: string } => {
    const isAr = data.language === "ar";
    const subject = isAr 
      ? `مرحباً بك في INFERA Vision، ${data.userName}!`
      : `Welcome to INFERA Vision, ${data.userName}!`;
    
    const content = `
      <div class="content">
        <p class="greeting">${isAr ? `مرحباً ${data.userName}،` : `Hello ${data.userName},`}</p>
        <p class="message">
          ${isAr 
            ? 'شكراً لانضمامك إلى INFERA Vision! أنت الآن جاهز لإنشاء دراسات جدوى استثمارية احترافية باستخدام الذكاء الاصطناعي.'
            : 'Thank you for joining INFERA Vision! You are now ready to create professional investment feasibility studies powered by AI.'}
        </p>
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">${isAr ? 'البريد الإلكتروني' : 'Email'}</span>
            <span class="info-value">${data.userEmail}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${isAr ? 'الخطة' : 'Plan'}</span>
            <span class="info-value">${isAr ? 'مجانية' : 'Free'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${isAr ? 'التقارير المتاحة' : 'Available Reports'}</span>
            <span class="info-value">3</span>
          </div>
        </div>
        <div style="text-align: center;">
          <a href="${data.actionUrl}" class="button">
            ${isAr ? 'ابدأ مشروعك الأول' : 'Start Your First Project'}
          </a>
        </div>
        <div class="divider"></div>
        <p class="message" style="font-size: 13px; color: #888;">
          ${isAr 
            ? 'إذا كان لديك أي أسئلة، لا تتردد في التواصل مع فريق الدعم.'
            : 'If you have any questions, feel free to reach out to our support team.'}
        </p>
      </div>
    `;
    
    return { subject, html: getEmailTemplate(content, isAr) };
  },

  reportGenerated: (data: EmailTemplateData): { subject: string; html: string } => {
    const isAr = data.language === "ar";
    const subject = isAr
      ? `تم إنشاء دراسة الجدوى: ${data.projectName}`
      : `Feasibility Study Generated: ${data.projectName}`;
    
    const content = `
      <div class="content">
        <p class="greeting">${isAr ? `مرحباً ${data.userName}،` : `Hello ${data.userName},`}</p>
        <p class="message">
          ${isAr
            ? 'تم إنشاء دراسة الجدوى الخاصة بمشروعك بنجاح! يمكنك الآن مراجعة التقرير الكامل وتحميله.'
            : 'Your feasibility study has been successfully generated! You can now review and download the complete report.'}
        </p>
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">${isAr ? 'اسم المشروع' : 'Project Name'}</span>
            <span class="info-value">${data.projectName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${isAr ? 'التاريخ' : 'Date'}</span>
            <span class="info-value">${new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
          </div>
        </div>
        <div style="text-align: center;">
          <a href="${data.actionUrl}" class="button">
            ${isAr ? 'عرض التقرير' : 'View Report'}
          </a>
        </div>
        <div class="divider"></div>
        <p class="message" style="font-size: 13px;">
          ${isAr
            ? 'يمكنك تصدير التقرير بصيغة PDF ومشاركته مع المستثمرين وأصحاب المصلحة.'
            : 'You can export the report as PDF and share it with investors and stakeholders.'}
        </p>
      </div>
    `;
    
    return { subject, html: getEmailTemplate(content, isAr) };
  },

  subscriptionUpgrade: (data: EmailTemplateData): { subject: string; html: string } => {
    const isAr = data.language === "ar";
    const subject = isAr
      ? `تم ترقية اشتراكك إلى ${data.planName}`
      : `Subscription Upgraded to ${data.planName}`;
    
    const content = `
      <div class="content">
        <p class="greeting">${isAr ? `مرحباً ${data.userName}،` : `Hello ${data.userName},`}</p>
        <p class="message">
          ${isAr
            ? `شكراً لترقية اشتراكك! أنت الآن على خطة ${data.planName} مع ميزات إضافية.`
            : `Thank you for upgrading! You are now on the ${data.planName} plan with additional features.`}
        </p>
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">${isAr ? 'الخطة' : 'Plan'}</span>
            <span class="info-value">${data.planName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${isAr ? 'المبلغ' : 'Amount'}</span>
            <span class="info-value">${data.amount}</span>
          </div>
        </div>
        <div style="text-align: center;">
          <a href="${data.actionUrl}" class="button">
            ${isAr ? 'الذهاب للوحة التحكم' : 'Go to Dashboard'}
          </a>
        </div>
      </div>
    `;
    
    return { subject, html: getEmailTemplate(content, isAr) };
  },

  subscriptionExpiring: (data: EmailTemplateData): { subject: string; html: string } => {
    const isAr = data.language === "ar";
    const subject = isAr
      ? 'تذكير: اشتراكك على وشك الانتهاء'
      : 'Reminder: Your Subscription is Expiring Soon';
    
    const content = `
      <div class="content">
        <p class="greeting">${isAr ? `مرحباً ${data.userName}،` : `Hello ${data.userName},`}</p>
        <p class="message">
          ${isAr
            ? `اشتراكك في خطة ${data.planName} سينتهي في ${data.expiryDate}. جدد اشتراكك للاستمرار في الاستفادة من جميع الميزات.`
            : `Your ${data.planName} subscription will expire on ${data.expiryDate}. Renew your subscription to continue enjoying all features.`}
        </p>
        <div style="text-align: center;">
          <a href="${data.actionUrl}" class="button">
            ${isAr ? 'تجديد الاشتراك' : 'Renew Subscription'}
          </a>
        </div>
      </div>
    `;
    
    return { subject, html: getEmailTemplate(content, isAr) };
  },

  passwordReset: (data: EmailTemplateData): { subject: string; html: string } => {
    const isAr = data.language === "ar";
    const subject = isAr
      ? 'إعادة تعيين كلمة المرور - INFERA Vision'
      : 'Password Reset - INFERA Vision';
    
    const content = `
      <div class="content">
        <p class="greeting">${isAr ? `مرحباً ${data.userName}،` : `Hello ${data.userName},`}</p>
        <p class="message">
          ${isAr
            ? 'لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة.'
            : 'We received a request to reset your account password. Click the button below to create a new password.'}
        </p>
        <div style="text-align: center;">
          <a href="${data.actionUrl}" class="button">
            ${isAr ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
          </a>
        </div>
        <div class="divider"></div>
        <p class="message" style="font-size: 13px; color: #888;">
          ${isAr
            ? 'إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني.'
            : 'If you did not request a password reset, you can ignore this email.'}
        </p>
      </div>
    `;
    
    return { subject, html: getEmailTemplate(content, isAr) };
  },

  reportLimitReached: (data: EmailTemplateData): { subject: string; html: string } => {
    const isAr = data.language === "ar";
    const subject = isAr
      ? 'لقد وصلت إلى الحد الأقصى للتقارير'
      : 'You Have Reached Your Report Limit';
    
    const content = `
      <div class="content">
        <p class="greeting">${isAr ? `مرحباً ${data.userName}،` : `Hello ${data.userName},`}</p>
        <p class="message">
          ${isAr
            ? 'لقد استخدمت جميع تقارير دراسات الجدوى المتاحة في خطتك الحالية. قم بالترقية لإنشاء المزيد من التقارير.'
            : 'You have used all available feasibility reports in your current plan. Upgrade to create more reports.'}
        </p>
        <div style="text-align: center;">
          <a href="${data.actionUrl}" class="button">
            ${isAr ? 'ترقية الخطة' : 'Upgrade Plan'}
          </a>
        </div>
      </div>
    `;
    
    return { subject, html: getEmailTemplate(content, isAr) };
  },
};

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = getEmailConfig();
    
    if (!config.user || !config.password) {
      console.warn("Email service not configured - missing credentials");
      return { success: false, error: "Email service not configured" };
    }

    const transporter = createTransporter();
    
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent successfully to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function sendWelcomeEmail(
  email: string,
  name: string,
  language: "en" | "ar",
  dashboardUrl: string
): Promise<{ success: boolean; error?: string }> {
  const template = emailTemplates.welcomeEmail({
    userName: name,
    userEmail: email,
    language,
    actionUrl: dashboardUrl,
  });
  return sendEmail(email, template.subject, template.html);
}

export async function sendReportGeneratedEmail(
  email: string,
  name: string,
  projectName: string,
  language: "en" | "ar",
  reportUrl: string
): Promise<{ success: boolean; error?: string }> {
  const template = emailTemplates.reportGenerated({
    userName: name,
    projectName,
    language,
    actionUrl: reportUrl,
  });
  return sendEmail(email, template.subject, template.html);
}

export async function sendSubscriptionUpgradeEmail(
  email: string,
  name: string,
  planName: string,
  amount: string,
  language: "en" | "ar",
  dashboardUrl: string
): Promise<{ success: boolean; error?: string }> {
  const template = emailTemplates.subscriptionUpgrade({
    userName: name,
    planName,
    amount,
    language,
    actionUrl: dashboardUrl,
  });
  return sendEmail(email, template.subject, template.html);
}

export async function sendReportLimitEmail(
  email: string,
  name: string,
  language: "en" | "ar",
  pricingUrl: string
): Promise<{ success: boolean; error?: string }> {
  const template = emailTemplates.reportLimitReached({
    userName: name,
    language,
    actionUrl: pricingUrl,
  });
  return sendEmail(email, template.subject, template.html);
}

export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("Email service connection verified successfully");
    return true;
  } catch (error) {
    console.error("Email service connection failed:", error);
    return false;
  }
}

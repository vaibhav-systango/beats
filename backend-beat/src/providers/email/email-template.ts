export interface EmailTemplate {
  subject: string;
  text: string;
  html?: string;
}

export const emailHeader = `
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 24px; text-align: center; color: #ffffff; font-family: 'Inter', system-ui, -apple-system, Arial, sans-serif; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">Beats</h1>
    <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; font-weight: 500; letter-spacing: 0.5px;">
      Enterprise Event Management Console
    </p>
  </div>
  <div style="padding: 24px; font-family: 'Inter', system-ui, -apple-system, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; background-color: #ffffff;">
`;

export const emailFooter = `
  </div>
  <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; font-family: 'Inter', system-ui, -apple-system, Arial, sans-serif; border-top: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
    <p style="margin: 0 0 6px; font-weight: 500;">&copy; 2026 Beats Platform. All rights reserved.</p>
    <p style="margin: 0; opacity: 0.8;">This is an automated system notification. Please do not reply directly.</p>
    <p style="margin: 10px 0 0;">
      <a href="https://www.beats-events.com" style="color: #4f46e5; text-decoration: none; font-weight: 600;">Visit Beats Portal</a>
    </p>
  </div>
`;

export function withLayout(content: string): string {
  return `<div style="max-width: 650px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">${emailHeader}${content}${emailFooter}</div>`;
}

export const emailTemplates: Record<string, EmailTemplate> = {
  'event.submitted': {
    subject: 'New Event Review Request: {{title}}',
    text: 'A new event has been registered and is awaiting your review.\n\nEvent Title: {{title}}\nOrganizer: {{organizerId}}\n\nView details on portal: {{adminPortalUrl}}/admin/events/{{eventId}}',
    html: withLayout(`
      <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">New Event Registered</h2>
      <p style="color: #475569; font-size: 14px; margin-bottom: 20px;">Hello Admin Team,</p>
      <p style="color: #475569; font-size: 14px; margin-bottom: 20px;">A new event has been registered and is awaiting your review. Below are the registration details:</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 15px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #64748b; width: 120px; border-bottom: 1px solid #f1f5f9;">Event Title:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9;">{{title}}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9;">Organizer:</td>
            <td style="padding: 6px 0; font-family: 'Inter', system-ui, sans-serif; color: #0f172a; border-bottom: 1px solid #f1f5f9; font-weight: 600;">{{organizerId}}</td>
          </tr>
        </table>
      </div>
      
      <div style="margin: 25px 0; text-align: center;">
        <a href="{{adminPortalUrl}}/admin/events/{{eventId}}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(37,99,235,0.2);">View on Portal</a>
      </div>
    `),
  },
  'event.approved': {
    subject: 'Your Event Has Been Approved! - {{title}}',
    text: 'Congratulations! Your event "{{title}}" has been approved and is now live.',
    html: withLayout(`
      <h2 style="color:#16a34a;margin-top:0;">Event Approved successfully!</h2>
      <p>Hello,</p>
      <p>We are pleased to inform you that your event <strong>{{title}}</strong> has been reviewed, approved, and is now live on the Beats platform!</p>
      <p>Thank you for hosting with Beats!</p>
    `),
  },
  'event.rejected': {
    subject: 'Event Submission Rejection: {{title}}',
    text: 'Your event submission "{{title}}" was rejected. Reason: {{reason}}',
    html: withLayout(`
      <h2 style="color:#dc2626;margin-top:0;">Event Review Rejected</h2>
      <p>Hello,</p>
      <p>Your recent submission for the event <strong>{{title}}</strong> has been reviewed and rejected by the admin team.</p>
      <p><strong>Reason for rejection:</strong></p>
      <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px;margin:15px 0;font-style:italic;color:#991b1b;">
        {{reason}}
      </div>
      <p>Your event has been unlocked and returned to <strong>DRAFT</strong> status. You can now edit the configuration and re-submit it for approval.</p>
    `),
  },
};

export * from './providers/email-provider.interface';
export * from './providers/sendgrid.provider';
export * from './providers/devmail.provider';
export * from './email.service';

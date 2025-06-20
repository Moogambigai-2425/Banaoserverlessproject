const AWS = require('aws-sdk');
// Use mock when offline
const ses = process.env.IS_OFFLINE 
  ? { 
      sendEmail: () => ({ promise: () => Promise.resolve() })
    } 
  : new AWS.SES();
module.exports.sendEmail = async (event) => {
  if (process.env.IS_OFFLINE) {
    console.log("Running in offline mode - mocking SES");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Mock email sent (offline mode)",yourData: event.body })
    };
  }
   try {
    const body = JSON.parse(event.body);
    
    // Validate input
    if (!body.receiver_email || !body.subject || !body.body_text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          message: 'Missing required fields: receiver_email, subject, body_text' 
        }),
      };
    }

    const ses = new AWS.SES();
    
    const params = {
      Destination: {
        ToAddresses: [body.receiver_email],
      },
      Message: {
        Body: {
          Text: {
            Data: body.body_text,
          },
        },
        Subject: {
          Data: body.subject,
        },
      },
      Source: process.env.EMAIL_SOURCE,
    };

    await ses.sendEmail(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Email sent successfully' 
      }),
    };
  } catch (error) {
    console.error('Error sending email:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Failed to send email',
        error: error.message 
      }),
    };
  }
};
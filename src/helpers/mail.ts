import * as nodemailer from "nodemailer";
import { Options } from "nodemailer/lib/smtp-transport";


const SUBJECT = "Reset Password";
const SUBJECT_VERIFY = "Verify Account"
const LINK_BASE_PART = "http://dev.boltos.io/users/reset-password";
const LINK_BASE_PART_VERIFY = "http://dev.boltos.io/users/verify-account";

const htmlOutput = (firstName: string, link: string): string => {
    return `
    <h3>Hi ${firstName},</h3>
     <p>You recently requested to reset the password for your account at BoltOS.</p>
     <p>You can use the button below to reset it. This password reset is only valid for the next 24 hours.</p>
     <h3>
        <a href="${link}">Reset your password</a>
    </h3>
     <p>Thanks,</p>
     <h3>The BoltOS Support Team</h3>
   `
};
const htmlOutputVerify = (firstName: string, link: string): string => {
    return `
    <h3>Hi ${firstName},</h3>
     <p>You recently requested to register an account at BoltOS.</p>
     <p>You can use the button below to verify it. Then login and start using BoltOS.</p>
     <h3>
        <a href="${link}">Verify your account</a>
    </h3>
     <p>Thanks,</p>
     <h3>The BoltOS Support Team</h3>
   `
};
const textOutput = (firstName: string, link: string): string => {
    return `
    Hi ${firstName}, you recently requested to reset the password for your account at BoltOS.
    You can use the button below to reset it. This password reset is only valid for the next 24 hours.
    Link to reset password: ${link}
    Thanks, The BoltOS Support Team.
`
}
;
const textOutputVerify = (firstName: string, link: string): string => {
    return `
    Hi ${firstName}, you recently requested to register an account at BoltOS.
    You can use the button below to verify it. Then login and start using BoltOS.
    Link to verify account: ${link}
    Thanks, The BoltOS Support Team.
`
}
;

const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 465,
    tls: {rejectUnauthorized: false},
    secure: false, // true for 465,
});

export function send(email: string, firstName: string, userId: string, randomKey: string) {
    let resetLink = LINK_BASE_PART + `?randomKey=${randomKey}&id=${userId}`;
    let mailOptions: Options = {
        from: '"BoltOS Support Team" <support@dev.boltos.io>', // sender address
        to: email, // list of receivers
        subject: SUBJECT, // Subject line
        text: textOutput(firstName, resetLink), // plain text body
        html: htmlOutput(firstName, resetLink) // html body
    };
    transporter.sendMail(mailOptions, (error, info) => {
       
        if (error) {
            console.log(error);
            console.log("failed");
        }
        // console.log('Message sent: %s', info.messageId);  
        // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });
};

export function sendVerify(email: string, firstName: string, userId: string, randomKey: string) {
    let verifyLink = LINK_BASE_PART_VERIFY + `?randomKey=${randomKey}&id=${userId}`;
    let mailOptions: Options = {
        from: '"BoltOS Support Team" <support@dev.boltos.io>', // sender address
        to: email, // list of receivers
        subject: SUBJECT_VERIFY, // Subject line
        text: textOutputVerify(firstName, verifyLink), // plain text body
        html: htmlOutputVerify(firstName, verifyLink) // html body
    };
    transporter.sendMail(mailOptions, (error, info) => {
       
        if (error) {
            console.log(error);
            console.log("failed");
        }
        // console.log('Message sent: %s', info.messageId);  
        // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });
};
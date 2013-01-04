package chatbox;

import java.util.*;
import javax.mail.*;
import javax.mail.internet.*;

public class MailBot {

    public MailBot() {

        //Do nothing

    }

    public void sendMessage(String to, String subject, String message)
        throws Exception {

        //Create a mailer

        Properties props = new Properties();
        props.setProperty("mail.host", "smtp.gmail.com");
        props.setProperty("mail.smtp.port", "587");
        props.setProperty("mail.smtp.auth", "true");
        props.setProperty("mail.smtp.starttls.enable", "true");

        Authenticator auth = new SMTPAuthenticator("rebelmoreproductively", "werling@2109");

        Session session = Session.getInstance(props, auth);

        MimeMessage msg = new MimeMessage(session);
        msg.setFrom(new InternetAddress("rebelmoreproductively@gmail.com"));
        msg.addRecipient(Message.RecipientType.TO, new InternetAddress(to));
        msg.setSubject(subject);
        msg.setSentDate(new Date());
        String html = message;
        msg.setContent(html, "text/html");
        Transport.send(msg);
    }

    private class SMTPAuthenticator extends Authenticator {

        private PasswordAuthentication authentication;

        public SMTPAuthenticator(String login, String password) {
            authentication = new PasswordAuthentication(login, password);
        }

        protected PasswordAuthentication getPasswordAuthentication() {
            return authentication;
        }
    }
}

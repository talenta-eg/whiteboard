package chatbox;

import java.io.*;
import java.sql.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class ResetAccountServlet extends HttpServlet {
    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response)
        throws IOException, ServletException {

        //Allocate an output writer to write the response message into the network socket

        PrintWriter out = response.getWriter();

        printResetAccount(out);
    }

    @Override
    public void doPost(HttpServletRequest request, HttpServletResponse response)
        throws IOException, ServletException {

        //Location

        String username = request.getParameter("username");
        String email = request.getParameter("email");
        String securityAnswer = request.getParameter("securityAnswer");

        //Set the response MIME type of the response message

        response.setContentType("text/html");

        //Allocate an output writer to write the response message into the network socket

        PrintWriter out = response.getWriter();

        //Do database stuff

        Connection conn = null;
        PreparedStatement stmt = null;

        try {

            //Attempts to connect to the database. ("hostname:port/default database", username, password)

            conn = DriverManager.getConnection(
                    "jdbc:mysql://localhost:3306/geekbase", "root", "password");

            if (securityAnswer == null) {
                stmt = conn.prepareStatement("select * from users where username = ? and email = ?");
                stmt.setString(1,username);
                stmt.setString(2,email);
                ResultSet rset = stmt.executeQuery();
                if (rset.next()) {

                    //Got the username and email right

                    String securityQuestion = rset.getString("securityQuestion");
                    printResetAccount2(out,username,email,securityQuestion);
                }
                else {

                    //Got the username or email wrong

                    out.write("Wrong information<br>");
                    printResetAccount(out);
                }
            }
            else {

                //Returning the second form

                stmt = conn.prepareStatement("select * from users where email = ? and username = ? and securityAnswer = ?");
                stmt.setString(1,email);
                stmt.setString(2,username);
                stmt.setString(3,securityAnswer);
                ResultSet rset = stmt.executeQuery();
                if (rset.next()) {
                    stmt.close();
                    String newPassword = Hashes.randomString();
                    String newPasswordHash = Hashes.MD5(newPassword);
                    stmt = conn.prepareStatement("update users set passwordHash = ? where email = ? and username = ? and securityAnswer = ?");
                    stmt.setString(1,newPasswordHash);
                    stmt.setString(2,email);
                    stmt.setString(3,username);
                    stmt.setString(4,securityAnswer);
                    stmt.executeUpdate();

                    //Send an email with the new password

                    MailBot mail = new MailBot();
                    try {
                        mail.sendMessage(email,"Password Reset for Graph","Your new password for "+username+": "+newPassword);
                    }
                    catch (Exception e) {
                        out.write("Mail sending didn't work");
                        e.printStackTrace();
                    }

                    //Let user know change was successful

                    printSuccessful(out,email);
                }
                else {
                    printWrongAnswer(out);
                    printResetAccount(out);
                }
            }
        }
        catch (SQLException e) {
            e.printStackTrace();
        }
        finally {
            out.close();
            try {
                if (stmt != null) stmt.close();
                if (conn != null) conn.close();
            }
            catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

    public void printResetAccount(PrintWriter out) {
        out.write("<html>");
            out.write("<form method='post'>");
                out.write("Reset your password:<br>");
                out.write("Enter your username:<br>");
                out.write("<input type='text' name='username'><br>");
                out.write("Enter your email:<br>");
                out.write("<input type='text' name='email'><br>");
                out.write("<input type='submit'>");
            out.write("</form>");
        out.write("</html>");
    }

    public void printResetAccount2(PrintWriter out, String username, String email, String securityQuestion) {
        out.write("<html>");
            out.write("<form method='post'>");
                out.write("Reset your password:<br>");
                out.write("Answer your security question:<br>");
                out.write(securityQuestion+"<br>");
                out.write("<input type='text' name='securityAnswer'><br>");
                out.write("<input type='hidden' name='username' value='"+username+"'>");
                out.write("<input type='hidden' name='email' value='"+email+"'>");
                out.write("<input type='submit'>");
            out.write("</form>");
        out.write("</html>");
    }

    public void printSuccessful(PrintWriter out,String email) {
        out.write("Password successfully reset. An email has been sent to "+email+"<br>");
        out.write("<a href='/chatbox'>Login</a>");
    }

    public void printWrongAnswer(PrintWriter out) {
        out.write("Wrong security answer");
        out.write("<a href='/chatbox/reset'>Try again</a>");
        out.write("<a href='/chatbox'>Login</a>");
    }

}

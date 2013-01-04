package chatbox;

import java.io.*;
import java.sql.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class ManageServlet extends HttpServlet {
    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response)
        throws IOException, ServletException {

        //Allocate an output writer to write the response message into the network socket

        PrintWriter out = response.getWriter();

        printManageAccount(out);
    }

    @Override
    public void doPost(HttpServletRequest request, HttpServletResponse response)
        throws IOException, ServletException {

        //Location

        String oldPassword = request.getParameter("oldpassword");
        String oldHash = Hashes.MD5(oldPassword);
        String password = request.getParameter("password");
        String hash = Hashes.MD5(password);

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

            //Get currently logged in user

            int uid = SessionManager.getLoggedInUserId(request,conn);
            if (uid == -1) {

                //Redirect to login

                out.write("<meta http-equiv='REFRESH' content='0;url=/chatbox'>");
            }
            else {

                stmt = conn.prepareStatement("select * from users where passwordHash = ?");
                stmt.setString(1,oldHash);
                ResultSet rset = stmt.executeQuery();
                if (rset.next()) {

                    //Update the user password

                    stmt = conn.prepareStatement("update users set passwordHash = ? where id = ? and passwordHash = ?", Statement.RETURN_GENERATED_KEYS);
                    stmt.setString(1,hash);
                    stmt.setInt(2,uid);
                    stmt.setString(3,oldHash);
                    
                    //Send query to server

                    stmt.executeUpdate();
                    printSuccessful(out);
                }
                else {
                    printWrongPassword(out);
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

    public void printManageAccount(PrintWriter out) {
        out.write("<html>");
            out.write("<form method='post'>");
                out.write("Change your password:<br>");
                out.write("Old Password:<br>");
                out.write("<input type='password' name='oldpassword'><br>");
                out.write("New Password:<br>");
                out.write("<input type='password' name='password'><br>");
                out.write("Copy Password:<br>");
                out.write("<input type='password' name='passwordCopy'><br>");
                out.write("<input type='submit'>");
            out.write("</form>");
            out.write("<a href='/chatbox'>Login</a>");
        out.write("</html>");
    }

    public void printSuccessful(PrintWriter out) {
        out.write("Password successfully updated<br><a href='/chatbox'>Return home</a>");
    }

    public void printWrongPassword(PrintWriter out) {
        out.write("Wrong password<br><a href='/chatbox/manage'>Try again</a><br><a href='/chatbox'>Return home</a>");
    }

}

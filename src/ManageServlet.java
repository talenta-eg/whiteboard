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
                    "jdbc:mysql://localhost:3306/geekbase", "root", "gizz442a");

            //Get currently logged in user

            int uid = SessionManager.getLoggedInUserId(request,conn);
            if (uid == -1) {

                //Redirect to login

                out.write("<meta http-equiv='REFRESH' content='0;url=/'>");
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
            out.write("<head>");
                out.write("<link rel='stylesheet' type='text/css' href='css/style.css'>");
            out.write("</head>");
            out.write("<body>");
                out.write("<center>");
                    out.write("<h1 class='tree' style='margin-top:45px'>Change Password</h1>");
                    out.write("<h3>always a good idea</h3>");
                    out.write("<img src='img/lock.png' style='margin-top:20px;'>");
                out.write("</center>");
                out.write("<div style='margin-left:auto;margin-right:auto;width:270px;'>");
                    out.write("<!--<img src='img/tree.png' style='float:left;margin-right:40px;margin-top:40px;'>-->");
                    out.write("<form style='margin-top:20px' method='post'>");
                        out.write("what's your old password?<br><input type='password' name='oldpassword' size='25'><br>");
                        out.write("what's your new password?<br><input type='password' name='password' size='25'><br>");
                        out.write("copy new password:<br><input type='password' name='passwordCopy' size='25'><br>");
                        out.write("<button style='margin-top:20px'>Change that password!</button>");
                    out.write("</form>");
                    out.write("<a href='/'>back home</a><br>");
                    out.write("<br>");
                out.write("</div>");
                out.write("<div class='credits'>this app brought to you by Keenon Werling &copy; 2013</div>");
            out.write("</body>");
        out.write("</html>");
    }

    public void printSuccessful(PrintWriter out) {
        out.write("<html>");
            out.write("<head>");
                out.write("<link rel='stylesheet' type='text/css' href='css/style.css'>");
            out.write("</head>");
            out.write("<body>");
                out.write("Password successfully updated<br><a href='/'>Return home</a>");
            out.write("</body>");
        out.write("</html>");
    }

    public void printWrongPassword(PrintWriter out) {
        out.write("<html>");
            out.write("<head>");
                out.write("<link rel='stylesheet' type='text/css' href='css/style.css'>");
            out.write("</head>");
            out.write("<body>");
                out.write("Wrong password<br><a href='/manage'>Try again</a><br><a href='/'>Return home</a>");
            out.write("</body>");
        out.write("</html>");
    }

}

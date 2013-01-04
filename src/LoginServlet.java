package chatbox;

import java.io.*;
import java.sql.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class LoginServlet extends HttpServlet {

    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response)
        throws IOException, ServletException {

        //Allocate an output writer to write the response message into the network socket

        PrintWriter out = response.getWriter();

        //Go through the shennanigans to get a connection to our database, then find the current user
        
        Connection conn = null;

        int userid = -1;
        PreparedStatement stmt = null;
        String username = "";

        try {

            //Attempts to connect to the database. ("hostname:port/default database", username, password)

            conn = DriverManager.getConnection(
                    "jdbc:mysql://localhost:3306/geekbase", "root", "password");

            userid = SessionManager.getLoggedInUserId(request,conn);
            stmt = conn.prepareStatement("select * from users where id = ?");
            stmt.setInt(1,userid);
            ResultSet rset = stmt.executeQuery();
            if (rset.next()) {
                username = rset.getString("username");
                boolean activated = rset.getInt("activated")==1;
                
                //We need to enter this user in our sessions log

                SessionManager.setLoggedInUserId(request,conn,userid);

                //Get all the projects that this user is involved in

                stmt.close();
                stmt = conn.prepareStatement("select * from userProjects where userId = ?");
                stmt.setInt(1,userid);
                rset = stmt.executeQuery();

                //Let the user know we're in

                printGreeting(out,username,activated,rset,conn);
            }
            else {

                //Let the user login

                printLogin(out);
            }

        }
        catch (SQLException e) {
            e.printStackTrace();
        }
        finally {
            try {
                if (conn != null) conn.close();
                if (stmt != null) stmt.close();
            }
            catch (SQLException e) {
                e.printStackTrace();
            }
            out.close();
        }
    }

    @Override
    public void doPost(HttpServletRequest request, HttpServletResponse response)
        throws IOException, ServletException {

        //Location

        String uri = request.getRequestURI().substring(1);

        String username = request.getParameter("username");
        String password = request.getParameter("password");
        String hash = Hashes.MD5(password);

        System.out.println(username+": "+password+", "+hash);

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

            //Make a Statement object within the connection

            stmt = conn.prepareStatement("select * from users where username = ? and passwordHash = ?");
            stmt.setString(1,username);
            stmt.setString(2,hash);

            //Send query to server

            ResultSet rset = stmt.executeQuery();

            //Process the query result set

            if(rset.next()) {
                boolean activated = rset.getInt("activated")==1;
                int userid = rset.getInt("id");
                
                //We need to enter this user in our sessions log

                SessionManager.setLoggedInUserId(request,conn,userid);

                //Get all the projects that this user is involved in

                stmt.close();
                stmt = conn.prepareStatement("select * from userProjects where userId = ?");
                stmt.setInt(1,userid);
                rset = stmt.executeQuery();

                //Let the user know we're in

                printGreeting(out,username,activated,rset,conn);
            }
            else {
                out.write("Wrong info:");
                printLogin(out);
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

    public void printLogin(PrintWriter out) {
        out.write("<html>");
            out.write("<form method='post'>");
                out.write("Username:<br>");
                out.write("<input type='text' name='username'><br>");
                out.write("Password:<br>");
                out.write("<input type='password' name='password'><br>");
                out.write("<input type='submit'>");
            out.write("</form>");
            out.write("<a href='createaccount'>Create an Account</a><br>");
            out.write("<a href='reset'>Forgot Password</a>");
        out.write("</html>");
    }

    public void printGreeting(PrintWriter out, String username, boolean activated, ResultSet projects, Connection conn) {
        out.write("<html>");
            out.write("Hello! Welcome back "+username+"<br>");
            out.write("<a href='logout'>logout</a><br>");
            out.write("<a href='manage'>change password</a><br>");
            out.write("<br><b>Visit a project:</b><br>");
            PreparedStatement stmt = null;
            int num = 0;
            try {
                while (projects.next()) {
                    boolean accepted = projects.getInt("accepted")==1;
                    stmt = conn.prepareStatement("select * from projects where id = ?");
                    stmt.setInt(1,projects.getInt("projectId"));
                    ResultSet rset = stmt.executeQuery();
                    if (rset.next()) {
                        num++;
                        if (accepted) {
                            out.write("<a href='/chatbox/project?id="+projects.getInt("projectId")+"'>"+rset.getString("name")+"</a><br>");
                        }
                        else {

                            //TODO: Make a way to accept/reject

                            out.write("Invitation to '"+rset.getString("name")+"': <a href='/chatbox/project?id="+projects.getInt("projectId")+"&accept=yes'>Accept</a> <a href='/chatbox/project?id="+projects.getInt("projectId")+"&accept=no'>Reject</a><br>");
                        }
                    }
                }
                if (num == 0) {
                    out.write("You're not involved in any projects. You should create one!<br>");
                }
            }
            catch (SQLException e) {

                //Do nothing

            }
            finally {
                try {
                    stmt.close();
                }
                catch (SQLException e) {
                }
            }
            out.write("<br><b>Create a new project:</b><br>");
            out.write("<form method='post' action='createproject'>");
                out.write("Project name:<br>");
                out.write("<input type='text' name='name'><br>");
                out.write("<input type='submit'>");
            out.write("</form>");
        out.write("</html>");
    }

}

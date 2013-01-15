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

            try {
                Class.forName("com.mysql.jdbc.Driver");
            }
            catch (ClassNotFoundException e) {
                e.printStackTrace();
            }
            conn = DriverManager.getConnection(
                    "jdbc:mysql://localhost:3306/geekbase", "root", "gizz442a");

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
            out.write("<head>");
                out.write("<link rel='stylesheet' type='text/css' href='css/style.css'>");
            out.write("</head>");
            out.write("<body>");
                out.write("<div style='margin-left:auto;margin-right:auto;width:635px;'>");
                    out.write("<center>");
                        out.write("<h1 class='tree' style='margin-top:45px'>Todo-Tree</h1>");
                        out.write("<h3>welcome to the new way to do</h3>");
                    out.write("</center>");
                    out.write("<img src='img/tree.png' style='float:left;margin-right:40px;margin-top:30px;'>");
                    out.write("<form method='post' style='float:left;margin-top:20px;'>");
                        out.write("username:<input type='text' name='username' size='25'><br>");
                        out.write("password:<input type='password' name='password' size='25'><br>");
                        out.write("<button>Login</button>");
                    out.write("</form>");
                    out.write("<br>");
                    out.write("<a href='createaccount'>want an account? (it's free)</a><br>");
                    out.write("<a href='reset' style='margin-top:5px'>forgot your password?</a><br>");
                out.write("</div>");
                out.write("<div class='credits'>this app brought to you with love by Keenon Werling &copy; 2013</div>");
            out.write("</body>");
        out.write("</html>");
    }

    public void printGreeting(PrintWriter out, String username, boolean activated, ResultSet projects, Connection conn) {

        out.write("<html>");
            out.write("<head>");
                out.write("<link rel='stylesheet' type='text/css' href='css/style.css'>");
                out.write("<div class='headerBar'>");
                    out.write("<a href='/logout'>logout</a><br>");
                    out.write("<a href='/manage'>change password</a>");
                out.write("</div>");
            out.write("</head>");
            out.write("<body>");
                out.write("<center>");
                    out.write("<h3 style='margin-top:40px;'>welcome back, "+username+"</h3>");
                out.write("</center>");
                out.write("<div style='margin-top:20px;'>");
                    out.write("<center>");
                        out.write("<h1 class='tree'>Work a Project</h1><hr>");
                        out.write("<div class='projectContainer'>");

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
                                    out.write("<div class='projectBox' onclick=\"parent.location='/project?id="+projects.getInt("projectId")+"'\">");
                                        out.write("<div class='projectBoxTitle'>"+rset.getString("name")+"</div>");
                                        out.write("<div class='projectBoxContent'>");
                                        if (accepted) {
                                            out.write("Todos: 0<br>");
                                            out.write("Finished: 0<br>");
                                            out.write("Members: 1<br>");
                                        }
                                        else {

                                            //TODO: Make a way to accept/reject

                                            out.write("You're invited! Click anywhere to accept");
                                            out.write("<form method='link' action='/project?id="+projects.getInt("projectId")+"&accept=no'>");
                                            out.write("<button style='padding:10px;margin-top:10px;' href=>Reject, bitch</button>");
                                            out.write("</form>");
                                        }
                                        out.write("</div>");
                                    out.write("</div>");
                                }
                            }
                            if (num == 0) {
                                out.write("<h2>You don't have any trees yet!<br>You should plant one. (create a project)</h2>");

                                //Super weirdly, this appears to be necessary in order to print a create button when you don't have any projects yet.
                                //If shit gets weird, delete this first, then work on other fixes

                                                out.write("</div>");
                                            out.write("</center>");
                                        out.write("</div>");
                                        out.write("<center>");
                                            out.write("<br>");
                                            out.write("<h1 class='tree'>Create a Project</h1>");
                                            out.write("<hr>");
                                            out.write("<div style='display:inline-block;'>");
                                                out.write("<img src='img/tree2.png' style='float:right;margin-left:15px;margin-top:10px;'>");
                                                out.write("<form style='float:right;text-align:right;margin-top:25px;' method='post' action='createproject'>");
                                                    out.write("<div style='padding-right:10px;margin-bottom:5px;'>name your project:</div>");
                                                    out.write("<input type='text' size='25' name='name'><br>");
                                                    out.write("<button style='float:right'>Create Project</button>");
                                                out.write("</form>");
                                            out.write("</div>");
                                        out.write("</center>");
                                        out.write("<div class='credits'>this app brought to you with love by Keenon Werling &copy; 2013</div>");
                                    out.write("</body>");
                                out.write("</html>");
                            }
                        }
                        catch (SQLException e) {

                            //Do nothing
                            System.out.println("SQL Exception!");
                            e.printStackTrace();

                        }
                        finally {
                            try {
                                stmt.close();
                            }
                            catch (SQLException e) {
                            }
                        }
                        out.write("</div>");
                    out.write("</center>");
                out.write("</div>");
                out.write("<center>");
                    out.write("<br>");
                    out.write("<h1 class='tree'>Create a Project</h1>");
                    out.write("<hr>");
                    out.write("<div style='display:inline-block;'>");
                        out.write("<img src='img/tree2.png' style='float:right;margin-left:15px;margin-top:10px;'>");
                        out.write("<form style='float:right;text-align:right;margin-top:25px;' method='post' action='createproject'>");
                            out.write("<div style='padding-right:10px;margin-bottom:5px;'>name your project:</div>");
                            out.write("<input type='text' size='25' name='name'><br>");
                            out.write("<button style='float:right'>Create Project</button>");
                        out.write("</form>");
                    out.write("</div>");
                out.write("</center>");
                out.write("<div class='credits'>this app brought to you with love by Keenon Werling &copy; 2013</div>");
            out.write("</body>");
        out.write("</html>");
    }

}

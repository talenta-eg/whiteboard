package chatbox;

import java.io.*;
import java.sql.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class InviteServlet extends HttpServlet {
    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response)
        throws IOException, ServletException {

        //Allocate an output writer to write the response message into the network socket

        PrintWriter out = response.getWriter();

        //There should never be gets on this servlet

        out.write("<html><meta http-equiv='REFRESH' content='0;url=/chatbox'></html>");
    }

    @Override
    public void doPost(HttpServletRequest request, HttpServletResponse response)
        throws IOException, ServletException {

        //Allocate an output writer to write the response message into the network socket

        PrintWriter out = response.getWriter();

        //Go through the shennanigans to get a connection to our database, then find the current user
        
        Connection conn = null;
        PreparedStatement stmt = null;

        String projectidString = request.getParameter("id");
        try {
            int projectid = Integer.parseInt(projectidString);
            try {

                //Attempts to connect to the database. ("hostname:port/default database", username, password)

                conn = DriverManager.getConnection(
                        "jdbc:mysql://localhost:3306/geekbase", "root", "password");

                int userid = SessionManager.getLoggedInUserId(request,conn);

                //Check if this user is authorized to view this project

                stmt = conn.prepareStatement("select * from userProjects where userId = ? and projectId = ?");
                stmt.setInt(1,userid);
                stmt.setInt(2,projectid);
                ResultSet rset = stmt.executeQuery();

                if (rset.next()) {

                    //This user is authorized to see this project
                    //So lets invite the person they want to invite

                    String email = request.getParameter("email");

                    //First we check if this person already has an account

                    stmt.close();
                    stmt = conn.prepareStatement("select * from users where email = ?");
                    stmt.setString(1,email);
                    ResultSet project = stmt.executeQuery();
                    int inviteid = 0;
                    if (project.next()) {

                        //Great, they already have an account (atleast a skeleton one), so we just grab its id

                        inviteid = project.getInt("id");
                    }
                    else {

                        //They don't yet have an account, so we make a skeleton one for them, so
                        //we can use its id in our tables.

                        stmt = conn.prepareStatement("insert into users(email) values (?)", Statement.RETURN_GENERATED_KEYS);
                        stmt.setString(1,email);
                        
                        //Send query to server

                        stmt.executeUpdate();

                        //Get the id we just generated

                        ResultSet keys = stmt.getGeneratedKeys();
                        keys.next();
                        inviteid = keys.getInt(1);
                        keys.close();
                        stmt.close();

                        //Test sending mail

                        MailBot mail = new MailBot();
                        try {
                            mail.sendMessage(email,"Invitation to work on a project in Graph","Visit <a href='http://www.rebelmoreproductively.com/chatbox/createaccount?email="+email+"'>here</a> to create your account!");
                        }
                        catch (Exception e) {
                            out.write("Mail sending didn't work");
                            e.printStackTrace();
                        }
                    }

                    //Now we need to add this project to our user
                    
                    stmt.close();
                    stmt = conn.prepareStatement("insert into userProjects(userId,projectId,accepted) values(?,?,0)");
                    stmt.setInt(1,inviteid);
                    stmt.setInt(2,projectid);
                    stmt.executeUpdate();

                    printSuccess(out,projectid);
                }
                else {

                    //Tell the user we didn't find a project

                    printError(out);
                }
            }
            catch (SQLException e) {
                e.printStackTrace();
                printError(out);
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
        catch (Exception e) {

            //Tell the user the number they entered didn't parse

            printError(out);
        }    
    }

    public void printError(PrintWriter out) {
        out.write("<html>");
            out.write("There was an error getting the project. Perhaps you're not authorized to view it?<br>");
            out.write("<a href='/chatbox'>Home</a><br>");
        out.write("</html>");
    }

    public void printSuccess(PrintWriter out, int projectId) {
        out.write("<html>");
            out.write("Invitation successfully sent!<br>");
            out.write("<a href='/chatbox'>Home</a>");
        out.write("</html>");
    }

}

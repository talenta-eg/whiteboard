package chatbox;

import java.io.*;
import java.sql.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class CreateProjectServlet extends HttpServlet {
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

        //Location

        String name = request.getParameter("name");

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

            //Grab the currently logged in user

            int uid = SessionManager.getLoggedInUserId(request,conn);

            if (uid == -1) {

                //There is no user logged in, for some reason. Redirect to login page

                printError(out);
            }
            else {

                //Add the new project to the projects table

                stmt = conn.prepareStatement("insert into projects(name,creatorId) values (?,?)", Statement.RETURN_GENERATED_KEYS);
                stmt.setString(1,name);
                stmt.setInt(2,uid);
                
                //Send query to server

                stmt.executeUpdate();

                //Get the id we just generated

                ResultSet keys = stmt.getGeneratedKeys();
                keys.next();
                int id = keys.getInt(1);
                keys.close();
                stmt.close();

                //Now it's time to associate the user to the project
                //We ignore the email value, because it won't be used

                stmt = conn.prepareStatement("insert into userProjects(userId,projectId,accepted) values (?,?,1)");
                stmt.setInt(1,uid);
                stmt.setInt(2,id);

                //Send query to server

                stmt.executeUpdate();

                //Let the user know we're good

                printSuccess(out,name,id);
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

    public void printError(PrintWriter out) {
        out.write("<html>");
            out.write("Error: Not logged in<br>");
            out.write("<a href='/chatbox'>Login</a>");
        out.write("</html>");
    }

    public void printSuccess(PrintWriter out, String projectName, int projectId) {
        out.write("<html>");
            out.write("Project '"+projectName+"' successfully created!<br>");
            out.write("<a href='/chatbox/project?id="+projectId+"'>Project Page</a><br>");
            out.write("<a href='/chatbox>Home</a><br>");
        out.write("</html>");
    }

}

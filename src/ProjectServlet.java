package chatbox;

import java.io.*;
import java.sql.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class ProjectServlet extends HttpServlet {

    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response)
        throws IOException, ServletException {

        //Allocate an output writer to write the response message into the network socket

        PrintWriter out = response.getWriter();

        //Go through the shennanigans to get a connection to our database, then find the current user
        
        Connection conn = null;
        PreparedStatement stmt = null;

        String projectidString = request.getParameter("id");
        String acceptString = request.getParameter("accept");
        try {
            int projectid = Integer.parseInt(projectidString);
            try {

                //Attempts to connect to the database. ("hostname:port/default database", username, password)

                conn = DriverManager.getConnection(
                        "jdbc:mysql://localhost:3306/geekbase", "root", "password");

                int userid = SessionManager.getLoggedInUserId(request,conn);
                if (acceptString != null && acceptString.equals("no")) {
                    stmt = conn.prepareStatement("delete from userProjects where userId = ? and projectId = ?");
                    stmt.setInt(1,userid);
                    stmt.setInt(2,projectid);
                    stmt.executeUpdate();
                    printRedirect(out);
                }
                else {
                    stmt = conn.prepareStatement("select * from userProjects where userId = ? and projectId = ?");
                    stmt.setInt(1,userid);
                    stmt.setInt(2,projectid);
                    ResultSet rset = stmt.executeQuery();

                    if (rset.next()) {

                        //This user is authorized to see this project

                        if (rset.getInt("accepted") == 0) {
                            stmt.close();
                            stmt = conn.prepareStatement("update userProjects set accepted = 1 where userId = ? and projectId = ?");
                            stmt.setInt(1,userid);
                            stmt.setInt(2,projectid);
                            stmt.executeUpdate();
                        }
                        stmt.close();
                        stmt = conn.prepareStatement("select * from projects where id = ?");
                        stmt.setInt(1,projectid);
                        ResultSet project = stmt.executeQuery();
                        if (project.next()) {
                            String projectName = project.getString("name");
                            boolean creator = (project.getInt("creatorId") == userid);
                            printProject(out,projectid,projectName,creator);
                        }
                    }
                    else {

                        //Tell the user we didn't find a project

                        printError(out);
                    }
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
        catch (Exception e) {

            //Tell the user the number they entered didn't parse

            printError(out);
        }
    }

    @Override
    public void doPost(HttpServletRequest request, HttpServletResponse response)
        throws IOException, ServletException {

        //Set the response MIME type of the response message
        
        response.setContentType("text/html");

        //Allocate an output writer to write the response message into the network socket

        PrintWriter out = response.getWriter();
        try {
            printRedirect(out);
        }
        finally {
            out.close();
        }
    }

    public void printRedirect(PrintWriter out) {
        out.write("<html><meta http-equiv='REFRESH' content='0;url=/chatbox'></html>");
    }

    public void printProject(PrintWriter out, int projectId, String projectName, boolean creator) {
        out.write("<html>");

            out.write("<head>");
                out.write("<script src='js/utilities.js'></script>");
                out.write("<script src='js/networkManager.js'></script>");
                out.write("<script src='js/staticObjects.js'></script>");
                out.write("<script src='js/dynamicAttributes.js'></script>");
                out.write("<script src='js/dynamicObjects.js'></script>");
                out.write("<script src='js/drawingManager.js'></script>");
                out.write("<script src='js/inputManager.js'></script>");
                out.write("<script src='js/todoItem.js'></script>");
                out.write("<script src='js/todoManager.js'></script>");
                out.write("<script src='js/main.js'></script>");
                out.write("<link rel='stylesheet' type='text/css' href='/chatbox/css/style.css'>");
            out.write("</head>");
            out.write("<body>");

                out.write("<b>"+projectName+"</b><br>");
                out.write("Invite Someone:<br>");
                out.write("<form method='post' action='/chatbox/invite?id="+projectId+"'>");
                    out.write("Email: ");
                    out.write("<input type='text' name='email'><br>");
                    out.write("<input type='submit'>");
                out.write("</form>");
                out.write("<a href='/chatbox'>Home</a><br>");
                if (creator) {
                    out.write("You created this project.");
                }

                out.write("<div>");
                    out.write("<div id='chatText'>");
                        out.write("<b>Chat box:</b><br>");
                    out.write("</div>");
                    out.write("<input type='text' id='chatBox'>");
                out.write("</div>");
                out.write("<button onclick='toggle();' class='unselectable'>Toggle</button>");
                out.write("<div style='width:20%;height:500px;position:absolute;right:0px;top:auto;' id='workflowparent'>");
                    out.write("<h1 class='unselectable'>Todo List:</h1>");
                    out.write("<div id='todoList'>");
                        out.write("<ul>");
                            out.write("<li class='unselectable'>Do this</li>");
                        out.write("</ul>");
                    out.write("</div>");
                out.write("</div>");
                out.write("<div id='wbpage' style='display:none'>");
                    out.write("<h1 class='unselectable'>Whiteboard:</h1>");
                    out.write("<h3 class='unselectable'>Share your thoughts</h3>");
                    out.write("<div style='width:70%;height:700px;overflow:scroll;position:relative' id='whiteboardparent'>");
                        out.write("<canvas id='whiteboard' class='rounded whiteboard' width='600' height='400'></canvas>");
                    out.write("</div>");
                out.write("</div>");
                out.write("<div id='wfpage'>");
                    out.write("<h1 class='unselectable'>Workflow:</h1>");
                    out.write("<h3 class='unselectable'>What needs to get done</h3>");
                    out.write("<div style='width:70%;height:700px;overflow:scroll;position:relative' id='workflowparent'>");
                        out.write("<canvas id='workflow' class='rounded whiteboard' width='600' height='400'></canvas>");
                    out.write("</div>");
                out.write("</div>");
                out.write("<a href='/chatbox/project?id="+projectId+"&accept=no'>Quit Project Permanently :(</a><br>");
            out.write("</body>");
        out.write("</html>");
    }

    public void printError(PrintWriter out) {
        out.write("<html>");
            out.write("There was an error getting the project. Perhaps you're not authorized to view it?<br>");
            out.write("<a href='/chatbox'>Home</a><br>");
        out.write("</html>");
    }
}

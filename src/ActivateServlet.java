package chatbox;

import java.io.*;
import java.sql.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class ActivateServlet extends HttpServlet {
    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response)
        throws IOException, ServletException {

        //Allocate an output writer to write the response message into the network socket

        PrintWriter out = response.getWriter();

        //Do database stuff

        Connection conn = null;
        PreparedStatement stmt = null;

        String key = request.getParameter("key");
        String username = "";
        int activated = -1;

        try {

            //Attempts to connect to the database. ("hostname:port/default database", username, password)

            conn = DriverManager.getConnection(
                    "jdbc:mysql://localhost:3306/geekbase", "root", "gizz442a");


            //Grab the user with this activation code

            stmt = conn.prepareStatement("select * from users where activationCode = ?");
            stmt.setString(1,key);
            ResultSet rset = stmt.executeQuery();
            if (rset.next()) {

                //Grab the data for the account we're activating

                activated = rset.getInt("activated");
                username = rset.getString("username");
            }
            
            if (activated == -1) {

                //Invalid code

                out.write("Sorry, an error has occurred.");
            }
            else if (activated == 1) {

                //Already activated

                out.write(username+" is already activated (maybe you refreshed the page). Anyways, you're good to go.");
            }
            else {

                //Send query to server

                stmt.close();
                stmt = conn.prepareStatement("update users set activated=1 where activationCode = ?");
                stmt.setString(1,key);
                stmt.executeUpdate();

                //Let the user know

                out.write(username+" is now an active account!");
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
}

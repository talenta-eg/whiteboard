import java.io.*;
import java.sql.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class QueryServlet extends HttpServlet {
    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response)
        throws IOException, ServletException {

        //Set the response MIME type of the response message
        
        response.setContentType("text/html");

        //Allocate an output writer to write the response message into the network socket

        PrintWriter out = response.getWriter();

        //Do database stuff

        Connection conn = null;
        Statement stmt = null;
        try {

            //Attempts to connect to the database. ("hostname:port/default database", username, password)

            conn = DriverManager.getConnection(
                    "jdbc:mysql://localhost:3306/ebookshop", "whiteboard", "wb2012");

            //Make a Statement object within the connection

            stmt = conn.createStatement();

            //Execute a SQL SELECT query

            String sqlStr = "select * from books where author = "
                + "'" + request.getParameter("author") + "'"
                        + " and qty > 0 order by price desc";

            // Print an HTML page as the output of the query

            out.println("<html><head><title>Query Response</title></head><body>");
            out.println("<h3>Thank you for your query.</h3>");
            out.println("<p>Your query is: " + sqlStr + "</p>"); // Echo for debugging;
            
            //Send query to server

            ResultSet rset = stmt.executeQuery(sqlStr);

            //Process the query result set

            int count = 0;
            while(rset.next()) {
                out.println("<p>" + rset.getString("author")
                        + ", " + rset.getString("title")
                        + ", $" + rset.getDouble("price") + "</p>");
                count++;
            }
            out.println("<p> "+count+" records found </p>");
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

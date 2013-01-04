package chatbox;

import java.io.*;
import java.sql.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class SessionManager {

    //Gets a guaranteed non-null session id

    public static String getSessionId(HttpServletRequest request) {

        //Get the current HttpSession
        //Tomcat handles cookies/other entries

        HttpSession session = request.getSession(true);

        //We attempt to grab the sessid, though it might be null

        String sessid = (String)session.getAttribute("sessid");

        //If sessid is null, we set it to a random string

        if (sessid == null) {
            sessid = Hashes.randomString();
            session.setAttribute("sessid",sessid);
        }

        //Now we send our session id back down the pipe

        return sessid;
    }
    
    //Returns the id of the logged in user, or -1 if there isn't one

    public static int getLoggedInUserId(HttpServletRequest request, Connection conn)
        throws SQLException {
        int userid = -1;

        //Get our session id

        String sessid = getSessionId(request);

        //We have to make sure our statement gets closed, even if we
        //encounter an error

        PreparedStatement stmt = null;
        try {

            //we know sessid isn't null, so we see if we have an entry for it in

            stmt = conn.prepareStatement("select * from sessions where sessid = ?");
            stmt.setString(1,sessid);
            ResultSet rset = stmt.executeQuery();
            if (rset.next()) {
                userid = rset.getInt("userid");
            }
        }
        finally {
            try {
                if (stmt != null) {
                    stmt.close();
                }
            }
            catch (SQLException e) {
                e.printStackTrace();
            }
        }

        //And we return our userid, -1 if there's no session present

        return userid;
    }

    //Sets the id of the logged in user

    public static void setLoggedInUserId(HttpServletRequest request, Connection conn, int userid)
        throws SQLException {

        //Get our session id

        String sessid = getSessionId(request);

        //We have to make sure our statement gets closed, even if we
        //encounter an error

        PreparedStatement stmt = null;
        try {
            boolean alreadyEntered = false;

            //We check for the presence of another entry for this sessid

            stmt = conn.prepareStatement("select * from sessions where sessid = ?");
            stmt.setString(1,sessid);
            ResultSet rset = stmt.executeQuery();
            if (rset.next()) {
                alreadyEntered = true;
            }
            stmt.close();
            
            //If we've already entered, we need to modify the entry

            if (alreadyEntered) {
                stmt = conn.prepareStatement("update sessions set userid=? where sessid=?");
                stmt.setInt(1,userid);
                stmt.setString(2,sessid);
                stmt.executeUpdate();
            }

            //We drop sessid into sessions, associated with the userid

            else {
                stmt = conn.prepareStatement("insert into sessions(sessid,userid) values(?,?)");
                stmt.setString(1,sessid);
                stmt.setInt(2,userid);
                stmt.executeUpdate();
            }
        }
        finally {
            try {
                if (stmt != null) {
                    stmt.close();
                }
            }
            catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

    //Logs out the current user

    public static void logoutUser(HttpServletRequest request, Connection conn)
        throws SQLException {

        //Get our session id

        String sessid = getSessionId(request);

        //We have to make sure our statement gets closed, even if we
        //encounter an error

        PreparedStatement stmt = null;
        try {
            
            //Delete our entry in sessions

            stmt = conn.prepareStatement("delete from sessions where sessid=?");
            stmt.setString(1,sessid);
            stmt.executeUpdate();
        }
        finally {
            try {
                if (stmt != null) {
                    stmt.close();
                }
            }
            catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}

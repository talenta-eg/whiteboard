package chatbox;

import java.io.IOException;
import java.sql.*;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.atomic.AtomicInteger;

import javax.servlet.http.HttpServletRequest;

import org.apache.catalina.websocket.MessageInbound;
import org.apache.catalina.websocket.StreamInbound;
import org.apache.catalina.websocket.WebSocketServlet;
import org.apache.catalina.websocket.WsOutbound;

import org.json.JSONObject;
import org.json.JSONException;

/**
 * Example web socket servlet for chat.
 */
public class ChatWebSocketServlet extends WebSocketServlet {

    private final AtomicInteger connectionIds = new AtomicInteger(0);
    private final Set<ChatMessageInbound> connections =
            new CopyOnWriteArraySet<ChatMessageInbound>();
    private ArrayList<JSONObject> projectState = new ArrayList<JSONObject>();

    @Override
    protected StreamInbound createWebSocketInbound(String subProtocol,
            HttpServletRequest request) {
        //System.out.println("New Socket");

        //Do database stuff

        Connection conn = null;
        PreparedStatement stmt = null;
        int userId = -1;
        String username = "";
        String projectIdString = request.getParameter("id");
        int projectId = -1;

        try {

            projectId = Integer.parseInt(projectIdString);

            //Attempts to connect to the database. ("hostname:port/default database", username, password)

            conn = DriverManager.getConnection(
                    "jdbc:mysql://localhost:3306/geekbase", "root", "password");

            //Get the user who's logged in, so we can use their information

            userId = SessionManager.getLoggedInUserId(request,conn);


            //Let's grab the project authorization, to make sure this user is
            //authorized

            stmt = conn.prepareStatement("select * from userProjects where userId = ? and projectId = ?");
            stmt.setInt(1,userId);
            stmt.setInt(2,projectId);
            ResultSet rset = stmt.executeQuery();
            if (rset.next()) {

                //We're Authorized
                //Now we should grab the username, for convenience later

                stmt.close();
                stmt = conn.prepareStatement("select * from users where id = ?");
                stmt.setInt(1,userId);
                rset = stmt.executeQuery();
                if (rset.next()) {
                    username = rset.getString("username");
                }

                //And let's grab the project state

                if (projectState.size() > projectId && projectState.get(projectId) != null) {

                    //A project state already exists! Let it be

                }
                else {

                    //Time for use to create our own project state

                    stmt.close();
                    stmt = conn.prepareStatement("select * from projects where id = ?");
                    stmt.setInt(1,projectId);
                    rset = stmt.executeQuery();
                    if (rset.next()) {
                        
                        //There's some saved project state

                        projectState.ensureCapacity(projectId);
                        projectState.set(projectId,new JSONObject(rset.getString("projectState")));
                    }
                    else {

                        //There's no saved project state, so we create a blank new one

                        projectState.ensureCapacity(projectId);
                        projectState.set(projectId,new JSONObject());
                    }
                }
                return new ChatMessageInbound(userId,username,projectId); //connectionIds.incrementAndGet()
            }
            else {

                //Not authorized

            }
        }
        catch (SQLException e) {
            e.printStackTrace();
        }
        catch (Exception e) {
            e.printStackTrace();
        }
        finally {
            try {
                if (stmt != null) stmt.close();
                if (conn != null) conn.close();
            }
            catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

    private final class ChatMessageInbound extends MessageInbound {

        private String username;
        private int uid;
        public int projectid;

        //Make a new socket

        private ChatMessageInbound(int id, String username, int projectid) {
            this.username = username;
            this.uid = id;
            this.projectid = projectid;
            System.out.println("New user: "+username+", id = "+id+", project "+projectid);
        }

        //When the socket opens, tell the world we're here

        @Override
        protected void onOpen(WsOutbound outbound) {
            connections.add(this);

            //Alert our presence

            try {
                JSONObject message = new JSONObject();
                message.put("type","chat");
                message.put("username","server");
                message.put("text",username+" has joined");
                broadcast(message);
            }
            catch (JSONException e) {
            }
        }

        //When the socket is closing, tell the world

        @Override
        protected void onClose(int status) {
            connections.remove(this);

            //Alert our absence

            try {
                JSONObject message = new JSONObject();
                message.put("type","chat");
                message.put("username","server");
                message.put("text",username+" has disconnected");
                broadcast(message);
            }
            catch (JSONException e) {
            }
        }

        //Dump on binary messages

        @Override
        protected void onBinaryMessage(ByteBuffer message) throws IOException {
            throw new UnsupportedOperationException(
                    "Binary message not supported.");
        }

        //Forward text messages

        @Override
        protected void onTextMessage(CharBuffer message) throws IOException {
            //System.out.println("Text message "+message);
            try {

                //Parse the JSON, then add the username to it

                JSONObject messageObj = new JSONObject(message.toString());
                messageObj.put("username",username);
                broadcast(messageObj);
            }
            catch (JSONException e) {

                //Client has had an error, or potentially was hacked.

                System.out.println("Invalid JSON");
            }
        }

        private void broadcast(JSONObject message) {
            String messageString = message.toString();
            //System.out.println("CHAT broadcasting "+messageString);
            for (ChatMessageInbound connection : connections) {

                //Only broadcast to people in the same project

                if (connection.projectid == projectid) {
                    try {
                        CharBuffer buffer = CharBuffer.wrap(messageString);
                        connection.getWsOutbound().writeTextMessage(buffer);
                    } catch (IOException ignore) {
                        // Ignore
                    }
                }
            }
        }
    }
}

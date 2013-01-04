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

/**
 * Example web socket servlet for chat.
 */
public class ChatWebSocketServlet extends WebSocketServlet {

    private final AtomicInteger connectionIds = new AtomicInteger(0);
    private final Set<ChatMessageInbound> connections =
            new CopyOnWriteArraySet<ChatMessageInbound>();

    @Override
    protected StreamInbound createWebSocketInbound(String subProtocol,
            HttpServletRequest request) {
        System.out.println("New Socket");

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

            //Now we should grab the username, for convenience later

            stmt = conn.prepareStatement("select * from users where id = ?");
            stmt.setInt(1,userId);
            ResultSet rset = stmt.executeQuery();
            if (rset.next()) {
                username = rset.getString("username");
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
        return new ChatMessageInbound(userId,username,projectId); //connectionIds.incrementAndGet()
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
            String message = String.format("* %s %s",
                    username, "has joined.");
            broadcast(message);
        }

        //When the socket is closing, tell the world

        @Override
        protected void onClose(int status) {
            connections.remove(this);
            String message = String.format("* %s %s",
                    username, "has disconnected.");
            broadcast(message);
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
            System.out.println("Text message "+message);

            // Never trust the client
            // TODO: Add a filter to prevent HTML printouts

            String filteredMessage = String.format("%s: %s",
                    username,message.toString());
            broadcast(filteredMessage);
        }

        private void broadcast(String message) {
            System.out.println("CHAT broadcasting "+message);
            for (ChatMessageInbound connection : connections) {

                //Only broadcast to people in the same project

                if (connection.projectid == projectid) {
                    try {
                        CharBuffer buffer = CharBuffer.wrap(message);
                        connection.getWsOutbound().writeTextMessage(buffer);
                    } catch (IOException ignore) {
                        // Ignore
                    }
                }
            }
        }
    }
}

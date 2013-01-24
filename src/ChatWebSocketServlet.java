package chatbox;

import java.io.IOException;
import java.sql.*;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.*;

import javax.servlet.http.HttpServletRequest;

import org.apache.catalina.websocket.MessageInbound;
import org.apache.catalina.websocket.StreamInbound;
import org.apache.catalina.websocket.WebSocketServlet;
import org.apache.catalina.websocket.WsOutbound;

import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;

/**
 * Example web socket servlet for chat.
 */
public class ChatWebSocketServlet extends WebSocketServlet {

    private final AtomicInteger connectionIds = new AtomicInteger(0);
    private final Set<ChatMessageInbound> connections =
            new CopyOnWriteArraySet<ChatMessageInbound>();
    private Map<Integer,ProjectState> projectState = new HashMap<Integer,ProjectState>();

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

        System.out.println("Output");

        try {

            projectId = Integer.parseInt(projectIdString);

            //Attempts to connect to the database. ("hostname:port/default database", username, password)

            conn = DriverManager.getConnection(
                    "jdbc:mysql://localhost:3306/geekbase", "root", "gizz442a");

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

                if (projectState.containsKey(projectId)) {

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

                        projectState.put(projectId,new ProjectState(rset.getString("projectState")));
                    }
                    else {

                        //There's no saved project state, so we create a blank new one

                        projectState.put(projectId,new ProjectState());
                    }
                }
                System.out.println("Authorized");
                return new ChatMessageInbound(userId,username,projectId); //connectionIds.incrementAndGet()
            }
            else {

                //Not authorized
                System.out.println("Not authorized");

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

        return null;
    }

    private class ProjectState {
        public JSONArray json;
        public JSONObject map;

        public ProjectState() {
            json = new JSONArray();
            map = new JSONObject();
        }

        public ProjectState(String state) {
            
            //Tick this to clear all your projects

            boolean clearProject = false;
            if (clearProject) {

                //If anything goes wrong, just make a clean object
                
                json = new JSONArray();
                map = new JSONObject();
            }
            else {
                try {
                    JSONObject total = new JSONObject(state);
                    json = total.getJSONArray("json");
                    map = total.getJSONObject("map");
                }
                catch (Exception e) {

                    //If anything goes wrong, just make a clean object
                    
                    json = new JSONArray();
                    map = new JSONObject();
                }
            }
        }

        public String getSaveState() {
            JSONObject total = new JSONObject();
            try {
                total.put("json",json);
                total.put("map",map);
            }
            catch (JSONException e) {
                
                //This should never happen

                System.out.println("The impossible. JSON lib is borked.");
                e.printStackTrace();
            }
            return total.toString();
        }

        public JSONObject getUpdateMessage() {
            JSONObject message = new JSONObject();
            try {
                message.put("type","update");
                message.put("update",json);
            }
            catch (JSONException e) {
                
                //This should never happen

                System.out.println("The impossible. JSON lib is borked.");
                e.printStackTrace();
            }
            return message;
        }

        public void onMessage(JSONObject message) {
            try {
                String messageType = message.getString("type");
                if (messageType.equals("chat")) {
                    // for now, don't store chats
                    //json.put(message);
                }
                else if (messageType.equals("todoItemCreated")) {
                    String id = ""+message.getInt("id");
                    System.out.println("Trying to created "+id);
                    if (map.optInt(id) != 0) {
                        System.out.println("Index already exists!");
                    }
                    else {
                        int index = json.length();
                        json.put(index,message);

                        //Store where this todo item is in our map

                        map.put(id,index);
                    }
                }
                else if (messageType.equals("itemEdited")) {

                    //Get the location of this item from our map

                    String id = ""+message.getInt("id");
                    int index = map.getInt(id);
                    
                    //Modify the json object at the index
                    
                    JSONObject item = json.getJSONObject(index);
                    item.remove("content");
                    item.put("content",message.getString("content"));

                    //Do the replacement

                    json.put(index,item);
                }
                else if (messageType.equals("itemDeleted")) {

                    //Get the location of this item from our map

                    String id = ""+message.getInt("id");
                    int index = map.optInt(id);
                    if (index != 0) {

                        //Null out the item - quick and easy, but not efficient

                        json.put(index,new JSONObject());
                        map.remove(id);

                        //Also, we need to delete all linkages to dead todo items

                        for (int i = 0; i < json.length(); i++) {
                            JSONObject o = json.getJSONObject(i);
                            if (o.optString("type").equals("todoItemsDependencyLinked")) {

                                //If this link references this object

                                if (id.equals(o.getInt("upper")+"") || id.equals(o.getInt("lower")+"")) {

                                    //Delete the link

                                    System.out.println("Cleaning up dead link");
                                    json.put(i,new JSONObject());
                                }
                            }
                        }
                    }
                }
                else if (messageType.equals("todoItemsDependencyLinked")) {
                    json.put(message);

                    //Store this in our map

                    String id = message.getInt("upper")+"-"+message.getInt("lower");
                    int index = json.length()-1;
                    map.put(id,index);
                }
                else if (messageType.equals("todoItemsDependencyRemoved")) {

                    //Get the location of this item from our map

                    String id = message.getInt("upper")+"-"+message.getInt("lower");
                    int index = map.getInt(id);
                    System.out.println("Unlinking todos "+id+" at index "+index);

                    //Null out the item - quick an easy, but not efficient

                    json.put(index,new JSONObject());
                    map.remove(id);
                }
                else if (messageType.equals("todoItemDone")) {

                    //Get the location of this item from our map

                    System.out.println(message.toString());

                    String id = ""+message.getInt("id");
                    int index = map.getInt(id);
                    
                    //Modify the json object at the index
                    
                    JSONObject item = json.getJSONObject(index);
                    item.remove("state");
                    item.put("state","done");

                    //Do the replacement

                    json.put(index,item);
                }
                else if (messageType.equals("todoItemUndone")) {

                    //Get the location of this item from our map

                    String id = ""+message.getInt("id");
                    int index = map.getInt(id);
                    
                    //Modify the json object at the index
                    
                    JSONObject item = json.getJSONObject(index);
                    item.remove("state");

                    //Do the replacement

                    json.put(index,item);
                }
                else if (messageType.equals("itemMoved")) {

                    //Get the location of this item from our map

                    String id = ""+message.getInt("id");
                    int index = map.getInt(id);
                    
                    //Modify the json object at the index
                    
                    JSONObject item = json.getJSONObject(index);
                    item.remove("xpos");
                    item.remove("ypos");
                    item.put("xpos",message.getInt("xpos"));
                    item.put("ypos",message.getInt("ypos"));

                    //Do the replacement

                    json.put(index,item);
                }
            }
            catch (JSONException e) {
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

            //Update our project state

            writeBack(projectState.get(projectid).getUpdateMessage());

            //Alert our presence

            try {
                JSONObject message = new JSONObject();
                message.put("type","chat");
                message.put("username","server");
                message.put("text",username+" joined");
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
                message.put("text",username+" disconnected");
                broadcast(message);
            }
            catch (JSONException e) {
            }

            //Save the current project state in MySQL

            //Do database stuff

            Connection conn = null;
            PreparedStatement stmt = null;

            try {

                //Attempts to connect to the database. ("hostname:port/default database", username, password)

                conn = DriverManager.getConnection(
                        "jdbc:mysql://localhost:3306/geekbase", "root", "gizz442a");

                //Let's grab the project authorization, to make sure this user is
                //authorized

                stmt = conn.prepareStatement("update projects set projectState = ? where id = ?");
                stmt.setString(1,projectState.get(projectid).getSaveState());
                stmt.setInt(2,projectid);
                stmt.executeUpdate();
                System.out.println("Saving project state for #"+projectid);
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
                if (messageObj.optString("type").equals("itemMoved")) {

                    //We'll save some bandwidth by not signing all the move commands

                }
                else {
                    messageObj.put("username",username);
                }
                broadcast(messageObj);
            }
            catch (JSONException e) {

                //Client has had an error, or potentially was hacked.

                System.out.println("Invalid JSON");
            }
        }

        //Broadcast messages

        private void broadcast(JSONObject message) {

            //Save our project state intelligently, hopefully

            String messageString = message.toString();
            //System.out.println("CHAT broadcasting "+messageString);

            projectState.get(projectid).onMessage(message);

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

        private void writeBack(JSONObject message) {
            String messageString = message.toString();
            System.out.println("Updating with: "+messageString);
            try {
                CharBuffer buffer = CharBuffer.wrap(messageString);
                this.getWsOutbound().writeTextMessage(buffer);
            } catch (IOException ignore) {

                // Ignore

            }
        }
    }
}

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

/**
 * Example web socket servlet for chat.
 */
public class MySocketServlet extends WebSocketServlet {

    private final Set<DocumentInbound> connections =
            new CopyOnWriteArraySet<DocumentInbound>();


    String content = "";
    
    @Override
    protected StreamInbound createWebSocketInbound(String subProtocol, HttpServletRequest request) {
        System.out.println("New request");

        return new DocumentInbound();

    }

    private final class DocumentInbound extends MessageInbound {

        //Make a new socket

        private DocumentInbound() {
            System.out.println("Opening a servlet");
        }

        //When the socket opens, tell the world we're here

        @Override
        protected void onOpen(WsOutbound outbound) {
            System.out.println("Opening connection");
            connections.add(this);
            try{
                this.getWsOutbound().writeTextMessage(CharBuffer.wrap(content));
            }catch(IOException e){}
        }

        //When the socket is closing, tell the world

        @Override
        protected void onClose(int status) {
            System.out.println("Closing connection");
            connections.remove(this);
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
            
            broadcast(message.toString());
            content=message.toString();    
        }

        //Broadcast messages

        private void broadcast(String messageString) {

            for (DocumentInbound connection : connections) {

                //Only broadcast to people in the same project

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

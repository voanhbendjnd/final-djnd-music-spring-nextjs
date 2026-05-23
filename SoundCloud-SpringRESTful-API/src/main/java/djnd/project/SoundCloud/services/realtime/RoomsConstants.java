package djnd.project.SoundCloud.services.realtime;

public final class RoomsConstants {
    // Topic for Redis Pub/Sub
    public static final String REDIS_ROOM_TOPIC = "room:events";
    // key
    public static final String REDIS_CHAT_ROOM_KEY = "room:chat";

    public static final String WS_FOLLOWER_ACTIVITY_QUEUE = "queue/follower/activity";
    public static final String WS_FOLLOWER_HOME_QUEUE = "queue/follower/home";

}

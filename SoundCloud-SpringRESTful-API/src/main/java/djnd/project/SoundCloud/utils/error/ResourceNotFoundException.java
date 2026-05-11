package djnd.project.SoundCloud.utils.error;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resource, Object value) {
        super(String.format("Resources (%s) with (%s) not found!", resource, value));
    }
}

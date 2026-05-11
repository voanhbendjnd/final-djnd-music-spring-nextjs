package djnd.project.SoundCloud.utils.error;

public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String resource, String value) {
        super(String.format("Resources (%s) with (%s) already exists!", resource, value));
    }
}

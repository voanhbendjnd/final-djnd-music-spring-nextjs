package djnd.project.SoundCloud.utils.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME) // active trong process run
@Target(ElementType.METHOD) // active trong method
public @interface ApiMessage {
    String value();
}

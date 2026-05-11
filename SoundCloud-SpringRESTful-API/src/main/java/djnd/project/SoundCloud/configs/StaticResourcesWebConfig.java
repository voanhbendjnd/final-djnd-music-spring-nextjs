package djnd.project.SoundCloud.configs;

import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticResourcesWebConfig implements WebMvcConfigurer {
    @Value("${djnd.upload-file.base-uri}")
    private String baseURI;

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/storage/**").addResourceLocations(baseURI);
    }
}

package djnd.project.SoundCloud.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ping")
public class HelloController {
    @GetMapping("/hello")
    public String hi() {
        return "hello djnd";
    }
}

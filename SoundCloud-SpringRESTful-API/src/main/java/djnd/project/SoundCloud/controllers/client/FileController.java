package djnd.project.SoundCloud.controllers.client;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import djnd.project.SoundCloud.services.UserService;
import djnd.project.SoundCloud.utils.annotation.ApiMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FileController {
    final UserService userService;
    @Value("${djnd.upload-file.base-uri}")
    private String baseURI;

    /*
     * dto: email
     * file
     */
    @PatchMapping("/avatar/upload")
    @ApiMessage("Update avatar for user")
    public ResponseEntity<?> updateAvatar(@RequestPart("avatar") MultipartFile file)
            throws URISyntaxException, IOException {
        if (this.userService.updateAvatarUser(file)) {
            return ResponseEntity.ok("Upload avatar successfull");
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload avatar");
    }

    @GetMapping("/{folder}/{filename:.+}")
    public ResponseEntity<Resource> getFile(
            @PathVariable("folder") String folder,
            @PathVariable("filename") String fileName) throws IOException {

        if (fileName.contains("..") || folder.contains("..")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        try {
            Path rootPath = Paths.get(baseURI);
            Path filePath = rootPath.resolve(folder).resolve(fileName).normalize();

            if (!filePath.startsWith(rootPath)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

}

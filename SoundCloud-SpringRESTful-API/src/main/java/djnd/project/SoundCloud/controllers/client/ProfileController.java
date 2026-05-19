package djnd.project.SoundCloud.controllers.client;

import java.io.IOException;

import org.apache.coyote.BadRequestException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import djnd.project.SoundCloud.services.ProfileService;
import djnd.project.SoundCloud.utils.annotation.ApiMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProfileController {
    final ProfileService profileService;

    @PatchMapping
    @ApiMessage("Update name and avatar profile")
    public ResponseEntity<?> updateNameAndAvatarProfile(@RequestParam(value = "name", required = false) String name,
            @RequestPart(value = "avatar", required = false) MultipartFile file) throws IOException {
        return ResponseEntity.ok(this.profileService.editProfile(name, file));

    }

    @GetMapping
    @ApiMessage("Get data user for profile")
    public ResponseEntity<?> getDataProfile() throws BadRequestException {
        return ResponseEntity.ok(this.profileService.getInformationUserProfile());
    }

    @PatchMapping("/background")
    @ApiMessage("Change or make background")
    public ResponseEntity<?> saveBackground(@RequestPart(value = "backgroundUrl", required = false) MultipartFile file) throws IOException, BadRequestException {
        return ResponseEntity.ok(this.profileService.saveBackgroundUrl(file));
    }

}

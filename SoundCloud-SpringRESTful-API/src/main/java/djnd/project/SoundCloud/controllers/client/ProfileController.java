package djnd.project.SoundCloud.controllers.client;

import java.io.IOException;

import org.apache.coyote.BadRequestException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
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


    @GetMapping("/user/{userId}")
    @ApiMessage("Get data by userId")
    public ResponseEntity<?> getDataProfileByUserId(@PathVariable("userId") String userIdStr) throws BadRequestException {
        try{
            var userId =  Long.parseLong(userIdStr);
            if(userId <= 0){
                throw new BadRequestException("User ID must be positive number!");
            }
            return ResponseEntity.ok(this.profileService.getInformationUserByUserId(userId));

        }
        catch(NumberFormatException ne){
            throw new BadRequestException("User ID must be number!");
        }

    }

    @PatchMapping("/background")
    @ApiMessage("Change or make background")
    public ResponseEntity<?> saveBackground(@RequestPart(value = "backgroundUrl", required = false) MultipartFile file) throws IOException, BadRequestException {
        return ResponseEntity.ok(this.profileService.saveBackgroundUrl(file));
    }

}

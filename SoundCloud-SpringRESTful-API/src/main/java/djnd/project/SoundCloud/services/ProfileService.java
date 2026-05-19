package djnd.project.SoundCloud.services;

import java.io.IOException;

import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import djnd.project.SoundCloud.domain.response.users.ResUser;
import djnd.project.SoundCloud.repositories.UserRepository;
import djnd.project.SoundCloud.utils.SecurityUtils;
import djnd.project.SoundCloud.utils.error.ResourceNotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequiredArgsConstructor
public class ProfileService {
    final UserRepository userRepository;
    final FileService fileService;
    @Value("${djnd.soundcloud.location.folder.img}")
    private String imgFolder;
    final UserService userService;

    // @Transactional
    public ResUser editProfile(String name, MultipartFile fileName) throws IOException,BadRequestException {
        var userId = SecurityUtils.getCurrentUserIdOrNull();
        if(userId == null)throw new BadRequestException("User ID not found!");
        var user = this.userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User ID", userId));
        if (fileName != null && !fileName.isEmpty()) {
            var avatarUrl = this.fileService.uploadToCloudinary(fileName, imgFolder).getSecureUrl();
            user.setAvatar(avatarUrl);
        }
        if (name != null && !name.isEmpty()) {
            user.setName(name);

        }
        var saveUser = this.userRepository.save(user);
        // this.userRepository.updateNameAndAvatarUser(name, avatarUrl, userId);
        var res = new ResUser();
        res.setEmail(saveUser.getEmail());
        res.setAvatar(saveUser.getAvatar());
        res.setName(saveUser.getName());
        return res;
    }

    public ResUser getInformationUserProfile()throws BadRequestException {
        var userId = SecurityUtils.getCurrentUserIdOrNull();
        if(userId == null) throw new BadRequestException("User ID not found!");
        var user = this.userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User ID", userId));
        return this.userService.toRes(user);
    }

    @Transactional
    public ResUser saveBackgroundUrl(MultipartFile fileName)throws IOException, BadRequestException {
        var userId = SecurityUtils.getCurrentUserIdOrNull();
        if(userId == null) throw new BadRequestException("User ID not found!");
        var lastUrl = this.fileService.uploadToCloudinary(fileName, imgFolder).getSecureUrl();
        var updated = this.userRepository.saveBackgroundUrl(lastUrl, userId);
        if(updated > 0){
            var res = new ResUser();
            res.setEmail(lastUrl);
            return res;
        }
        throw new BadRequestException("Update background url failed");
    }

}

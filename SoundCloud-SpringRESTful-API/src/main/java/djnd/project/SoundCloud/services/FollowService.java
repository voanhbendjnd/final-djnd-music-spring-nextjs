package djnd.project.SoundCloud.services;

import org.apache.coyote.BadRequestException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import djnd.project.SoundCloud.domain.entity.Follow;
import djnd.project.SoundCloud.domain.response.ResFollower;
import djnd.project.SoundCloud.repositories.FollowRepository;
import djnd.project.SoundCloud.repositories.UserRepository;
import djnd.project.SoundCloud.utils.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@RequiredArgsConstructor
public class FollowService {
    FollowRepository followRepository;
    UserRepository userRepository;

    @Transactional
    public ResFollower toggleFollow(Long followingId) throws BadRequestException {
        var userId = SecurityUtils.getCurrentUserIdOrNull();
        if (userId.equals(followingId)) {
            throw new BadRequestException("Follower ID must be not equal following ID");
        }
        var deleted = this.followRepository.deleteFollower(userId, followingId);

        if (deleted > 0) {
            this.userRepository.decreaseCountMyFollowers(followingId, 1);

        } else {
            var follow = new Follow();
            var you = this.userRepository.getReferenceById(userId);
            var userYouWantToFollow = this.userRepository.getReferenceById(followingId);

            follow.setFollower(you);
            follow.setFollowing(userYouWantToFollow);
            this.followRepository.save(follow);
            this.userRepository.increaseCountMyFollowers(followingId, 1);

        }
        var res = new ResFollower();
        res.setUploaderId(followingId);
        res.setCountFollowers(this.userRepository.getCountFollowers(followingId));
        res.setIsFollowed(deleted <= 0);
        return res;
    }
}

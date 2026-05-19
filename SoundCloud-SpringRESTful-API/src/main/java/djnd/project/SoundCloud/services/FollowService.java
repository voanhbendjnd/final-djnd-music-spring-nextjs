package djnd.project.SoundCloud.services;

import djnd.project.SoundCloud.domain.entity.User;
import djnd.project.SoundCloud.domain.response.ResultPaginationDTO;
import djnd.project.SoundCloud.utils.error.PermissionException;
import org.apache.coyote.BadRequestException;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
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
        if(userId == null) throw new BadRequestException("Current user id is null");
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

    public ResultPaginationDTO getAllFollowing(Pageable pageable) throws BadRequestException {
        var userId = SecurityUtils.getCurrentUserIdOrNull();
        if(userId == null) throw new BadRequestException("Current user id is null");
        var res = new ResultPaginationDTO();
        var meta = new ResultPaginationDTO.Meta();
        var page = this.followRepository.fetchAllFollowingsByFollowerId(userId, pageable);
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setPages(page.getTotalPages());
        meta.setTotal(page.getTotalElements());
        res.setMeta(meta);
        res.setResult(page.getContent());
        return res;

    }

    public ResultPaginationDTO getAllFollowers(Pageable pageable) throws BadRequestException {
        var followingId = SecurityUtils.getCurrentUserIdOrNull();
        if(followingId == null) throw new BadRequestException("Current user id is null");
        var res = new ResultPaginationDTO();
        var meta = new ResultPaginationDTO.Meta();
        var page = this.followRepository.fetchAllFollowerByFollowingId(pageable, followingId);
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setPages(page.getTotalPages());
        meta.setTotal(page.getTotalElements());
        res.setMeta(meta);
        res.setResult(page.getContent());
        return res;
    }


}

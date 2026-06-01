package djnd.project.SoundCloud.services;

import djnd.project.SoundCloud.domain.response.ResultPaginationDTO;
import djnd.project.SoundCloud.utils.error.UnauthorizedException;
import org.apache.coyote.BadRequestException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
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
        if(userId == null) throw new UnauthorizedException("You are not logged in!");
        if (userId.equals(followingId)) {
            throw new BadRequestException("Follower ID must be not equal following ID");
        }
        var deleted = this.followRepository.deleteFollower(userId, followingId);
        boolean isLiked = false;
        if (deleted > 0) {
            this.userRepository.decreaseCountMyFollowers(followingId, 1);
        } else {
            try{
                var follow = new Follow();
                var you = this.userRepository.getReferenceById(userId);
                var userYouWantToFollow = this.userRepository.getReferenceById(followingId);

                follow.setFollower(you);
                follow.setFollowing(userYouWantToFollow);
                this.followRepository.save(follow);
                this.userRepository.increaseCountMyFollowers(followingId, 1);
                isLiked =true;
            }
            catch(DataIntegrityViolationException e){
                isLiked = true;
            }


        }
        var res = new ResFollower();
        res.setUploaderId(followingId);
        res.setCountFollowers(this.userRepository.getCountFollowers(followingId));
        res.setIsFollowed(isLiked);
        return res;
    }

    public ResultPaginationDTO getAllFollowing(Pageable pageable, Long publicUserId) throws BadRequestException {
        var userId =publicUserId != null ? publicUserId : SecurityUtils.getCurrentUserIdOrNull();
        if(userId == null) throw new BadRequestException("Current user id is null");
        if(!this.userRepository.existsById(userId)){
            throw new BadRequestException("User ID not found");
        }
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

    public ResultPaginationDTO getAllFollowers(Pageable pageable, Long publicUserId) throws BadRequestException {
        var followingId = publicUserId != null ? publicUserId : SecurityUtils.getCurrentUserIdOrNull();
        if(followingId == null) throw new BadRequestException("Current user id is null");
        if(!this.userRepository.existsById(followingId)) {
            throw new BadRequestException("ID not found!");
        }
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

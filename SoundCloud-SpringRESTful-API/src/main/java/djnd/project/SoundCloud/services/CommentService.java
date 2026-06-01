package djnd.project.SoundCloud.services;

import djnd.project.SoundCloud.domain.entity.CommentLike;
import djnd.project.SoundCloud.domain.response.ResLike;
import djnd.project.SoundCloud.repositories.CommentLikeRepository;
import djnd.project.SoundCloud.repositories.UserRepository;
import djnd.project.SoundCloud.utils.SecurityUtils;
import djnd.project.SoundCloud.utils.error.ObjectNotFoundException;
import djnd.project.SoundCloud.utils.error.UnauthorizedException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import jakarta.persistence.criteria.Join;

import djnd.project.SoundCloud.domain.entity.Comment;
import djnd.project.SoundCloud.domain.entity.Track;
import djnd.project.SoundCloud.domain.request.CommentDTO;
import djnd.project.SoundCloud.domain.response.ResComment;
import djnd.project.SoundCloud.domain.response.ResultPaginationDTO;
import djnd.project.SoundCloud.repositories.CommentRepository;
import djnd.project.SoundCloud.utils.error.AccessToResourceException;
import djnd.project.SoundCloud.utils.error.ResourceNotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class CommentService {
    CommentRepository commentRepository;
    TrackService trackService;
    UserService userService;
    CommentLikeRepository commentLikeRepository;
    UserRepository userRepository;
    public void create(CommentDTO dto) throws AccessToResourceException {
        var comment = new Comment();
        comment.setContent(dto.content());
        comment.setMoment(dto.moment());
        comment.setTrack(this.trackService.getTrackOrThrow(dto.trackId()));
        comment.setUser(this.userService.getUserLoggedOrThrow());
        this.commentRepository.save(comment);
    }

    public ResComment fetchById(Long id) {
        var comment = this.commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment ID", id + ""));
        return this.toRes(comment);

    }

    public ResultPaginationDTO fetchAllWithPaginationDTO(Specification<Comment> spec, Pageable pageable, Long trackId) {
        var res = new ResultPaginationDTO();
        var meta = new ResultPaginationDTO.Meta();
        if (trackId != null) {
            Specification<Comment> sp = (r, q, c) -> {
                Join<Comment, Track> joinTrack = r.join("track");
                return c.equal(joinTrack.get("id"), trackId);
            };
            spec = spec.and(sp);
        }

        var page = this.commentRepository.findAll(spec, pageable);
        int requestedPage = pageable.getPageNumber() + 1;
        int totalPages = page.getTotalPages();

        // Validate page bounds
        if (requestedPage > totalPages && totalPages > 0) {
            meta.setPage(requestedPage);
            meta.setPageSize(pageable.getPageSize());
            meta.setPages(totalPages);
            meta.setTotal(page.getTotalElements());
            res.setMeta(meta);
            res.setResult(Collections.emptyList());
            return res;
        }

        meta.setPage(requestedPage);
        meta.setPageSize(pageable.getPageSize());
        meta.setPages(totalPages);
        meta.setTotal(page.getTotalElements());
        res.setMeta(meta);
        var resComments = page.getContent().stream().map(this::toRes).toList();

        // set state liked comment
        this.stateIsLikedComment(resComments);

        res.setResult(resComments);
        return res;
    }

    public void stateIsLikedComment(List<ResComment> resComments) {
        var userId = SecurityUtils.getCurrentUserIdOrNull();
        if(userId != null){
            var listCommentIds = resComments.stream().map(ResComment::getId).toList();
            var isLikedComments = this.commentLikeRepository.getIsLikedComments(userId, listCommentIds);
            resComments.forEach(comment ->{
                comment.setIsLiked(isLikedComments.contains(comment.getId()));
            });
        }

    }

    private ResComment toRes(Comment comment) {
        var res = new ResComment();
        res.setContent(comment.getContent());
        res.setLikesCount(comment.getLikesCount());
        res.setId(comment.getId());
        res.setTrackTitle(comment.getTrack().getTitle());
        res.setUserEmail(comment.getUser().getEmail());
        res.setUpdatedAt(comment.getUpdatedAt());
        res.setCreatedAt(comment.getCreatedAt());
        res.setUpdatedBy(comment.getUpdatedBy());
        res.setCreatedBy(comment.getCreatedBy());
        res.setMoment(comment.getMoment());
        res.setCountLikes(comment.getLikesCount());
        var userComment = new ResComment.UserComment();
        var trackComment = new ResComment.TrackComment();
        var user = comment.getUser();
        var track = comment.getTrack();
        userComment.setAvatar(user.getAvatar());
        userComment.setCountFollowers(user.getCountFollowers());
//        userComment.setEmail(user.getEmail());
        userComment.setId(user.getId());
        userComment.setName(user.getName());
//        userComment.setRole(user.getRole().getName());
//        userComment.setType(user.getType());
        trackComment.setId(track.getId());
        trackComment.setImgUrl(track.getImgUrl());
        trackComment.setTitle(track.getTitle());
        res.setUser(userComment);
        res.setTrack(trackComment);
        return res;
    }

    public void deleteById(Long id) {
        var comment = this.commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment ID", id));
        this.commentRepository.delete(comment);
    }
    @Transactional
    public ResLike toggleLike(Long commentId){
        var userId = SecurityUtils.getCurrentUserIdOrNull();
        if(userId == null){
            throw new UnauthorizedException("You are not logged in!");
        }
        boolean isLiked = false;

        // check comment
        var deleted = this.commentLikeRepository.deleteByCommentIdAndUserId(commentId, userId);
        if(deleted > 0){
             commentRepository.decrementCountLikeComment(commentId);
        }
        else{
            try{
                var comment = this.commentRepository.findById(commentId).orElseThrow(()-> new ObjectNotFoundException("Comment not found!"));
                var commentLike = new CommentLike();
                commentLike.setComment(comment);
                commentLike.setUser(this.userRepository.getReferenceById(userId));
                this.commentLikeRepository.saveAndFlush(commentLike);
                commentRepository.incrementCountLikeComment(commentId);
                isLiked = true;
            }
            catch(DataIntegrityViolationException div){
                isLiked = true;
            }
        }
        var res = new ResLike();
        res.setCountLikes(this.commentRepository.countByCommentId(commentId));
        res.setIsLiked(isLiked);
        return res;


    }



}

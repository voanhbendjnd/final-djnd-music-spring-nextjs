package djnd.project.SoundCloud.services;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import jakarta.persistence.criteria.Join;

import djnd.project.SoundCloud.domain.entity.Comment;
import djnd.project.SoundCloud.domain.entity.Track;
import djnd.project.SoundCloud.domain.request.CommentDTO;
import djnd.project.SoundCloud.domain.response.ResComment;
import djnd.project.SoundCloud.domain.response.ResultPaginationDTO;
import djnd.project.SoundCloud.repositories.CommentRepository;
import djnd.project.SoundCloud.utils.error.PermissionException;
import djnd.project.SoundCloud.utils.error.ResourceNotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class CommentService {
    CommentRepository commentRepository;
    TrackService trackService;
    UserService userService;

    public void create(CommentDTO dto) throws PermissionException {
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
            res.setResult(java.util.Collections.emptyList());
            return res;
        }

        meta.setPage(requestedPage);
        meta.setPageSize(pageable.getPageSize());
        meta.setPages(totalPages);
        meta.setTotal(page.getTotalElements());
        res.setMeta(meta);
        res.setResult(page.getContent().stream().map(this::toRes).toList());
        return res;
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
        var userComment = new ResComment.UserComment();
        var trackComment = new ResComment.TrackComment();
        var user = comment.getUser();
        var track = comment.getTrack();
        userComment.setAvatar(user.getAvatar());
        userComment.setEmail(user.getEmail());
        userComment.setId(user.getId());
        userComment.setName(user.getName());
        userComment.setRole(user.getRole().getName());
        userComment.setType(user.getType());
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

}

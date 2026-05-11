package djnd.project.SoundCloud.utils.error;

import java.nio.file.AccessDeniedException;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import djnd.project.SoundCloud.domain.response.RestResponse;

@RestControllerAdvice
public class GlobalException {

    // @ExceptionHandler(value = { HttpMessageNotReadableException.class })
    // public ResponseEntity<?>
    // handleHttpNotReadable(HttpMessageNotReadableException ex) {
    // var status = HttpStatus.METHOD_NOT_ALLOWED.value();
    // var res = new RestResponse<>();
    // res.setMessage(ex.getMessage());
    // res.setError("Method not allowed");
    // res.setStatusCode(status);
    // return ResponseEntity.status(status).body(res);

    // }

    @ExceptionHandler(value = {
            BadCredentialsException.class
    })
    public ResponseEntity<RestResponse<Object>> handleBadCredentialException() {
        var status = HttpStatus.UNAUTHORIZED.value();
        var res = new RestResponse<>();
        res.setStatusCode(status);
        res.setMessage("Username or password incorrect!");
        res.setError("Login Failed");
        return ResponseEntity.status(status).body(res);
    }

    @ExceptionHandler(value = {
            UsernameNotFoundException.class,
    })
    public ResponseEntity<RestResponse<Object>> handleIdException(Exception ex) {
        var res = new RestResponse<>();
        var status = HttpStatus.BAD_REQUEST.value();
        res.setStatusCode(status);
        res.setError("ID exception!");
        res.setMessage(ex.getMessage());
        return ResponseEntity.status(status).body(res);
    }

    @ExceptionHandler(value = {
            MethodArgumentNotValidException.class
    })
    public ResponseEntity<RestResponse<Object>> handleEntityException(MethodArgumentNotValidException ex) {
        var result = ex.getBindingResult();
        final List<FieldError> fieldErrors = result.getFieldErrors();
        var res = new RestResponse<>();
        var status = HttpStatus.BAD_REQUEST.value();
        res.setStatusCode(status);
        res.setError(ex.getBody().getDetail());
        var errors = fieldErrors.stream().map(f -> f.getDefaultMessage()).collect(Collectors.toList());
        res.setMessage(errors.size() > 1 ? errors : errors.get(0));
        return ResponseEntity.status(status).body(res);

    }

    @ExceptionHandler(value = {
            DuplicateResourceException.class,

    })
    public ResponseEntity<RestResponse<Object>> handleDuplicateResourceException(DuplicateResourceException ex) {
        var status = HttpStatus.CONFLICT.value();
        var res = new RestResponse<>();
        res.setError("Duplicate resource!");
        res.setStatusCode(status);
        res.setMessage(ex.getMessage());
        return ResponseEntity.status(status).body(res);
    }

    @ExceptionHandler(value = { ResourceNotFoundException.class })
    public ResponseEntity<RestResponse<Object>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        var status = HttpStatus.BAD_REQUEST.value();
        var res = new RestResponse<>();
        res.setError("Not found!");
        res.setStatusCode(status);
        res.setMessage(ex.getMessage());
        return ResponseEntity.status(status).body(res);
    }

    @ExceptionHandler(value = { HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class })
    public ResponseEntity<RestResponse<Object>> handleJsonParsingException(HttpMessageNotReadableException ex) {
        var status = HttpStatus.BAD_REQUEST.value();
        var res = new RestResponse<>();
        res.setStatusCode(status);
        res.setMessage(ex.getMessage());
        res.setError("Invalid JSON or Data Type Mismatch!");
        return ResponseEntity.status(status).body(res);
    }

    @ExceptionHandler(value = {
            PasswordMismatchException.class
    })
    public ResponseEntity<RestResponse<Object>> handlePasswordMismatch(PasswordMismatchException ex) {
        var status = HttpStatus.BAD_REQUEST.value();
        var res = new RestResponse<>();
        res.setStatusCode(status);
        res.setError("Password!");
        res.setMessage(ex.getMessage());
        return ResponseEntity.status(status).body(res);
    }

    @ExceptionHandler(value = { AccessDeniedException.class })
    public ResponseEntity<RestResponse<Object>> handleForbidden(AccessDeniedException ex) {
        var status = HttpStatus.FORBIDDEN.value();
        var res = new RestResponse<>();
        res.setError("Forbidden!");
        res.setMessage(ex.getMessage());
        res.setStatusCode(status);
        return ResponseEntity.status(status).body(res);
    }

    @ExceptionHandler(value = { PermissionException.class })
    public ResponseEntity<RestResponse<Object>> handlePermissionException(Exception ex) {
        var res = new RestResponse<>();
        var status = HttpStatus.FORBIDDEN.value();
        res.setStatusCode(status);
        res.setError("FORBIDDEN!");
        res.setMessage(ex.getMessage());
        return ResponseEntity.status(status).body(res);
    }

}

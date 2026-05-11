package djnd.project.SoundCloud.cloudinary.services;

import java.io.IOException;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class StorageData {
    Cloudinary cloudinary;

    public Map upload(MultipartFile file, String folder) throws IOException {
        return this.cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap("folder", folder, "resource_type", "auto"));
    }

    public void delete(String publicId, String resourceType) throws IOException {
        this.cloudinary.uploader().destroy(
                publicId,
                ObjectUtils.asMap("resource_type", resourceType));
    }
}

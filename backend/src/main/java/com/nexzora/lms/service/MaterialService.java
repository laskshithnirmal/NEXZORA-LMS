package com.nexzora.lms.service;

import com.nexzora.lms.dto.Requests.VideoMaterialRequest;
import com.nexzora.lms.dto.Responses.MaterialDto;
import com.nexzora.lms.entity.CourseClass;
import com.nexzora.lms.entity.LearningMaterial;
import com.nexzora.lms.entity.MaterialType;
import com.nexzora.lms.entity.Role;
import com.nexzora.lms.entity.User;
import com.nexzora.lms.exception.ApiException;
import com.nexzora.lms.repository.LearningMaterialRepository;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class MaterialService {

    private final LearningMaterialRepository materialRepository;
    private final ClassService classService;
    private final FileStorageService fileStorage;

    public MaterialService(LearningMaterialRepository materialRepository, ClassService classService,
                           FileStorageService fileStorage) {
        this.materialRepository = materialRepository;
        this.classService = classService;
        this.fileStorage = fileStorage;
    }

    @Transactional(readOnly = true)
    public List<MaterialDto> listForClass(Long classId, User user) {
        classService.findAccessible(classId, user);
        return materialRepository.findByCourseClassIdOrderByCreatedAtDesc(classId).stream()
                .map(MaterialDto::from).toList();
    }

    @Transactional
    public MaterialDto uploadPdf(Long classId, User teacher, String title, String description, MultipartFile file) {
        CourseClass c = classService.findAccessible(classId, teacher);
        if (title == null || title.isBlank()) {
            throw ApiException.badRequest("Title is required");
        }
        if (title.length() > 150) {
            throw ApiException.badRequest("Title must be at most 150 characters");
        }
        String stored = fileStorage.storePdf(file);
        LearningMaterial m = new LearningMaterial();
        m.setCourseClass(c);
        m.setTitle(title.trim());
        m.setDescription(description == null || description.isBlank() ? null : description.trim());
        m.setType(MaterialType.PDF);
        m.setFilePath(stored);
        m.setFileName(file.getOriginalFilename());
        m.setFileSize(file.getSize());
        m.setUploadedBy(teacher);
        return MaterialDto.from(materialRepository.save(m));
    }

    @Transactional
    public MaterialDto addVideo(Long classId, User teacher, VideoMaterialRequest req) {
        CourseClass c = classService.findAccessible(classId, teacher);
        LearningMaterial m = new LearningMaterial();
        m.setCourseClass(c);
        m.setTitle(req.title().trim());
        m.setDescription(req.description() == null || req.description().isBlank() ? null : req.description().trim());
        m.setType(MaterialType.VIDEO);
        m.setVideoUrl(req.videoUrl().trim());
        m.setUploadedBy(teacher);
        return MaterialDto.from(materialRepository.save(m));
    }

    @Transactional
    public void delete(Long materialId, User user) {
        LearningMaterial m = materialRepository.findById(materialId)
                .orElseThrow(() -> ApiException.notFound("Material"));
        if (user.getRole() != Role.ADMIN && !classService.isTeacherOf(m.getCourseClass(), user)) {
            throw ApiException.forbidden("You can only delete materials from your own classes");
        }
        fileStorage.delete(m.getFilePath());
        materialRepository.delete(m);
    }

    /** Returns the material (for its file name) after checking the user may read it. */
    @Transactional(readOnly = true)
    public LearningMaterial findPdfForDownload(Long materialId, User user) {
        LearningMaterial m = materialRepository.findById(materialId)
                .orElseThrow(() -> ApiException.notFound("Material"));
        if (m.getType() != MaterialType.PDF) {
            throw ApiException.badRequest("This material is not a PDF");
        }
        classService.findAccessible(m.getCourseClass().getId(), user);
        return m;
    }

    public Resource loadFile(LearningMaterial m) {
        return fileStorage.load(m.getFilePath());
    }
}

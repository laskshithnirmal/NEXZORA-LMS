package com.nexzora.lms.controller;

import com.nexzora.lms.entity.LearningMaterial;
import com.nexzora.lms.security.CurrentUser;
import com.nexzora.lms.service.MaterialService;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

/** PDF downloads for any authenticated user with access to the material's class. */
@RestController
public class MaterialController {

    private final MaterialService materialService;

    public MaterialController(MaterialService materialService) {
        this.materialService = materialService;
    }

    @GetMapping("/api/materials/{id}/file")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        LearningMaterial m = materialService.findPdfForDownload(id, CurrentUser.get());
        Resource file = materialService.loadFile(m);
        String name = m.getFileName() == null ? "material.pdf" : m.getFileName();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(name, StandardCharsets.UTF_8).build().toString())
                .body(file);
    }
}

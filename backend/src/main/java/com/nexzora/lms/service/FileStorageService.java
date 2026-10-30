package com.nexzora.lms.service;

import com.nexzora.lms.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/** Stores uploaded PDFs on the local disk under app.upload-dir. */
@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);
    private static final byte[] PDF_MAGIC = {'%', 'P', 'D', 'F'};

    private final Path root;

    public FileStorageService(@Value("${app.upload-dir:uploads}") String uploadDir) throws IOException {
        this.root = Path.of(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    /** Validates that the file is a real PDF and saves it. Returns the stored file name. */
    public String storePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("Please choose a PDF file to upload");
        }
        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        if (!original.endsWith(".pdf")) {
            throw ApiException.badRequest("Only PDF files are allowed");
        }
        try (InputStream in = file.getInputStream()) {
            byte[] head = in.readNBytes(4);
            for (int i = 0; i < PDF_MAGIC.length; i++) {
                if (head.length < 4 || head[i] != PDF_MAGIC[i]) {
                    throw ApiException.badRequest("The file is not a valid PDF");
                }
            }
        } catch (IOException e) {
            throw ApiException.badRequest("Could not read the uploaded file");
        }
        String stored = UUID.randomUUID() + ".pdf";
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, root.resolve(stored), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to save file", e);
        }
        return stored;
    }

    public Resource load(String storedName) {
        Path path = resolveSafe(storedName);
        if (!Files.exists(path)) {
            throw ApiException.notFound("File");
        }
        return new PathResource(path);
    }

    public void delete(String storedName) {
        if (storedName == null) {
            return;
        }
        try {
            Files.deleteIfExists(resolveSafe(storedName));
        } catch (IOException e) {
            log.warn("Could not delete file {}", storedName, e);
        }
    }

    private Path resolveSafe(String storedName) {
        Path path = root.resolve(storedName).normalize();
        if (!path.startsWith(root)) {
            throw ApiException.badRequest("Invalid file path");
        }
        return path;
    }
}

package com.ai.service;

import java.io.File;
import java.io.IOException;

public interface LogService {
    File downloadErrLog() throws IOException;
}

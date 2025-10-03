const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * 청구서 엑셀 파일 생성 API
 * POST /api/excel-generate
 */
module.exports = (req, res) => {
  try {
    const { invoiceData } = req.body;
    
    console.log('Received invoiceData:', JSON.stringify(invoiceData, null, 2));
    
    if (!invoiceData) {
      return res.status(400).json({
        success: false,
        error: '청구서 데이터가 필요합니다.'
      });
    }

    // 파일 경로 설정
    const templatePath = path.join(process.cwd(), 'docs', '청구서 상세 폼.xlsx');
    const outputDir = path.join(process.cwd(), 'temp');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFileName = `청구서_${invoiceData.invoice_no || invoiceData.header?.invoice_no || 'INV'}_${timestamp}.xlsx`;
    const outputPath = path.join(outputDir, outputFileName);
    const scriptPath = path.join(process.cwd(), 'scripts', 'invoice_template_renderer.py');

    // temp 디렉토리 생성
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 템플릿 파일 존재 확인
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({
        success: false,
        error: '청구서 템플릿 파일을 찾을 수 없습니다.'
      });
    }

    // Python 스크립트 존재 확인
    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({
        success: false,
        error: '엑셀 생성 스크립트를 찾을 수 없습니다.'
      });
    }

    // JSON 데이터를 임시 파일로 저장
    const tempJsonPath = path.join(outputDir, `temp_data_${Date.now()}.json`);
    fs.writeFileSync(tempJsonPath, JSON.stringify(invoiceData, null, 2), 'utf8');
    
    // Python 스크립트 실행
    const pythonProcess = spawn('/Users/leechanhee/ConstructionManagement-Installer/venv/bin/python', [
      scriptPath,
      '--template', templatePath,
      '--output', outputPath,
      '--data', tempJsonPath
    ], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      console.log('Python process exit code:', code);
      console.log('Python stdout:', stdout);
      console.log('Python stderr:', stderr);
      
      if (code !== 0) {
        console.error('Python script error:', stderr);
        return res.status(500).json({
          success: false,
          error: `엑셀 생성 중 오류가 발생했습니다: ${stderr || 'Unknown error'}`
        });
      }

      try {
        const result = JSON.parse(stdout);
        
        if (result.success) {
          // 파일 다운로드 응답
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(outputFileName)}"`);
          
          const fileStream = fs.createReadStream(outputPath);
          fileStream.pipe(res);
          
          // 파일 전송 후 임시 파일 삭제
          fileStream.on('end', () => {
            setTimeout(() => {
              if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
              }
              if (fs.existsSync(tempJsonPath)) {
                fs.unlinkSync(tempJsonPath);
              }
            }, 1000);
          });
          
        } else {
          // 실패시에도 임시 JSON 파일 정리
          if (fs.existsSync(tempJsonPath)) {
            fs.unlinkSync(tempJsonPath);
          }
          res.status(500).json({
            success: false,
            error: result.error || '엑셀 파일 생성에 실패했습니다.'
          });
        }
      } catch (parseError) {
        console.error('Result parsing error:', parseError);
        // 파싱 오류시에도 임시 JSON 파일 정리
        if (fs.existsSync(tempJsonPath)) {
          fs.unlinkSync(tempJsonPath);
        }
        res.status(500).json({
          success: false,
          error: '결과 처리 중 오류가 발생했습니다.'
        });
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Python process error:', error);
      // 프로세스 오류시에도 임시 JSON 파일 정리
      if (fs.existsSync(tempJsonPath)) {
        fs.unlinkSync(tempJsonPath);
      }
      res.status(500).json({
        success: false,
        error: 'Python 스크립트 실행 중 오류가 발생했습니다.'
      });
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};
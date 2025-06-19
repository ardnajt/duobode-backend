import { MultipartFile } from '@fastify/multipart';
import path from 'path';
import fs from 'fs';
import promises from 'fs/promises';

export namespace Utils {
	/** Upload the file in a file system with the provided name, returning its url */
	export async function uploadFile(data: MultipartFile, subdir: string) {
		const uploadDir = path.join(process.cwd(), 'uploads', 'images', subdir);

		// If the dir doesn't exist
		if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

		const ext = path.extname(data.filename);
		const suffix = Date.now();
		const filename = `${suffix}${Math.round(Math.random() * 1e9)}${ext}`;
		const filepath = path.join(uploadDir, filename);

		await promises.writeFile(filepath.toString(), await data.toBuffer());
		return `/uploads/images/${subdir}/${filename}`;
	}
}
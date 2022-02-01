import { Express } from "express";
import { MediaHelpers } from "../../helpers/MediaHelpers";

// TODO: Refresh media
// TODO: Upload media
// TODO: Delete media
// TODO: Update media metadata
// TODO: Create media folder

export const media = async (app: Express) => {
  app.get(`/api/media`, async (req, res) => {

    /**
     * folders: []
     * media: [{
     *  filename: string
     *  
     * }]
     * selectedFolder: string
     * total: number
     */

    const { page, folder, sorting } = req.query;
    const files = await MediaHelpers.getMedia(parseInt(page as string) || 0, (folder as string) || '', (sorting as any) || null);
    return res.json(files);
  });
};
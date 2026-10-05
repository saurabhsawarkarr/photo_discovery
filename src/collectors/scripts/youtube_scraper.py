import json
import sys
import time
from youtubesearchpython import VideosSearch
from youtube_comment_downloader import YoutubeCommentDownloader

def scrape_youtube(query, max_videos=5, max_comments_per_video=50):
    all_records = []
    seen_vids = set()
    downloader = YoutubeCommentDownloader()
    
    try:
        videos_search = VideosSearch(query, limit=max_videos)
        results = videos_search.result()
        
        for video in results.get('result', []):
            vid_id = video.get('id')
            if not vid_id or vid_id in seen_vids:
                continue
            seen_vids.add(vid_id)
            
            count = 0
            try:
                comments = downloader.get_comments(vid_id)
                for comment in comments:
                    if count >= max_comments_per_video:
                        break
                    
                    all_records.append({
                        "video_id": vid_id,
                        "video_title": video.get("title"),
                        "comment_text": comment.get('text'),
                        "author": comment.get('author'),
                        "time": comment.get('time'),
                        "votes": comment.get('votes'),
                        "query": query
                    })
                    count += 1
            except Exception as e:
                print(f"Error fetching comments for {vid_id}: {e}", file=sys.stderr)
                
    except Exception as e:
        print(f"Error searching YouTube for {query}: {e}", file=sys.stderr)
        
    print(json.dumps(all_records))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python youtube_scraper.py <query> [max_videos] [max_comments_per_video]", file=sys.stderr)
        sys.exit(1)
        
    query = sys.argv[1]
    max_videos = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    max_comments = int(sys.argv[3]) if len(sys.argv) > 3 else 20
    scrape_youtube(query, max_videos, max_comments)

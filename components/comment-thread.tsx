import { CommentComposer } from "@/components/comment-composer";
import { formatDisplayDate, getInitials } from "@/lib/store";
import type { FeedComment } from "@/lib/types";

type CommentThreadProps = {
  comments: FeedComment[];
  currentUserId?: string;
  postId: string;
  compact?: boolean;
};

function CommentReplyBlock({ comment, postId }: { comment: FeedComment; postId: string }) {
  return (
    <div className="comment-replies">
      {comment.replies.map((reply) => (
        <div className="comment-card reply-card" key={reply.id}>
          <div className="comment-header">
            <span className="mini-avatar">{getInitials(reply.author.fullName)}</span>
            <div>
              <strong>{reply.author.fullName}</strong>
              <div className="muted">{formatDisplayDate(reply.createdAt)}</div>
            </div>
          </div>
          <p className="comment-body">{reply.body}</p>
        </div>
      ))}
      <CommentComposer
        helper="Reply with details, clarification, or quick answers for other students."
        parentId={comment.id}
        placeholder="Reply to this comment..."
        postId={postId}
        rows={2}
        submitLabel="Reply"
      />
    </div>
  );
}

export function CommentThread({
  comments,
  currentUserId,
  postId,
  compact = false
}: CommentThreadProps) {
  return (
    <div className={`comment-list ${compact ? "compact-thread" : ""}`}>
      {comments.map((comment) => (
        <div className="comment-thread" key={comment.id}>
          <div className="comment-card">
            <div className="comment-header">
              <span className="mini-avatar">{getInitials(comment.author.fullName)}</span>
              <div>
                <strong>{comment.author.fullName}</strong>
                <div className="muted">{formatDisplayDate(comment.createdAt)}</div>
              </div>
            </div>
            <p className="comment-body">{comment.body}</p>
          </div>
          {currentUserId ? <CommentReplyBlock comment={comment} postId={postId} /> : null}
          {!currentUserId && comment.replies.length > 0 ? (
            <div className="comment-replies">
              {comment.replies.map((reply) => (
                <div className="comment-card reply-card" key={reply.id}>
                  <div className="comment-header">
                    <span className="mini-avatar">{getInitials(reply.author.fullName)}</span>
                    <div>
                      <strong>{reply.author.fullName}</strong>
                      <div className="muted">{formatDisplayDate(reply.createdAt)}</div>
                    </div>
                  </div>
                  <p className="comment-body">{reply.body}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

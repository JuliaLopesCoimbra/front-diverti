"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Divider,
  Avatar,
  IconButton,
  Paper,
  TextField,
  CircularProgress,
  Button,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ReplyIcon from "@mui/icons-material/Reply";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import { CommentResponse } from "@/app/services/comments/commentService";
import { NewsDetailsResponse } from "@/app/services/news/newsService";
import { ProfileResponse } from "@/app/services/profile/profileService";
import { formatDate } from "@/app/utils/dateUtils";
import CommentInput from "./CommentInput";
import ReplyItem from "./ReplyItem";
import UserProfileModal from "@/app/components/user/UserProfileModal";
import UsersWhoLikedModal from "@/app/components/common/UsersWhoLikedModal";

interface CommentSectionProps {
  news: NewsDetailsResponse;
  isAuthenticated: boolean;
  isAdminMaster: boolean;
  isSubadmin: boolean;
  currentUser: ProfileResponse | null;
  commentText: string;
  submittingComment: boolean;
  expandedComments: Set<number>;
  replies: Record<number, CommentResponse[]>;
  replyingTo: number | null;
  replyTexts: Record<number, string>;
  submittingReply: Record<number, boolean>;
  likingComment: Record<number, boolean>;
  loadingReplies: Record<number, boolean>;
  loadingMoreReplies: Record<number, boolean>;
  repliesOffset: Record<number, number>;
  hasMoreReplies: Record<number, boolean>;
  hasMoreComments: boolean;
  loadingMoreComments: boolean;
  onCommentTextChange: (text: string) => void;
  onCommentSubmit: () => void;
  onLikeComment: (commentId: number, parentCommentId?: number | null) => void;
  onToggleReplies: (commentId: number) => void;
  onStartReply: (commentId: number) => void;
  onReplyTextChange: (commentId: number, text: string) => void;
  onReplySubmit: (commentId: number) => void;
  onCancelReply: (commentId: number) => void;
  onDeleteComment: (commentId: number, content: string) => void;
  onLoadMoreReplies: (commentId: number) => void;
  onLoadMoreComments: () => void;
}

export default function CommentSection({
  news,
  isAuthenticated,
  isAdminMaster,
  isSubadmin,
  currentUser,
  commentText,
  submittingComment,
  expandedComments,
  replies,
  replyingTo,
  replyTexts,
  submittingReply,
  likingComment,
  loadingReplies,
  loadingMoreReplies,
  repliesOffset,
  hasMoreReplies,
  hasMoreComments,
  loadingMoreComments,
  onCommentTextChange,
  onCommentSubmit,
  onLikeComment,
  onToggleReplies,
  onStartReply,
  onReplyTextChange,
  onReplySubmit,
  onCancelReply,
  onDeleteComment,
  onLoadMoreReplies,
  onLoadMoreComments,
}: CommentSectionProps) {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [focusedReplyInput, setFocusedReplyInput] = useState<number | null>(null);

  const handleUserClick = (userId: number) => {
    setSelectedUserId(userId);
    setProfileModalOpen(true);
  };

  const handleLikesClick = (commentId: number, likesCount: number) => {
    if (likesCount > 0) {
      setSelectedCommentId(commentId);
      setLikesModalOpen(true);
    }
  };

  return (
    <Box mt={2}>
      <Typography
        fontWeight={600}
        fontSize={14}
        sx={{ color: "#fff", mb: 1.5 }}
      >
        {news.comments_count > 0
          ? `${news.comments_count} ${
              news.comments_count === 1 ? "comentário" : "comentários"
            }`
          : "Nenhum comentário"}
      </Typography>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 1.5 }} />

      {/* Campo de input de comentário - ANTES da lista */}
      {isAuthenticated && (
        <Box sx={{ mb: 2 }}>
          <CommentInput
            value={commentText}
            onChange={onCommentTextChange}
            onSubmit={onCommentSubmit}
            placeholder="Adicione um comentário..."
            disabled={news?.status === "pending" || news?.status === "rejected"}
            submitting={submittingComment}
            userPhoto={currentUser?.profile_photo || undefined}
            userName={currentUser?.name || undefined}
            userEmail={currentUser?.email || undefined}
          />
        </Box>
      )}

      {/* Lista de comentários */}
      <Box
        sx={{
          maxHeight: "400px",
          overflowY: "auto",
          mb: 2,
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "rgba(255,255,255,0.05)",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(255,255,255,0.2)",
            borderRadius: "3px",
          },
        }}
      >
        {news.comments.length === 0 ? (
          <Typography
            fontSize={13}
            sx={{ color: "rgba(255,255,255,0.5)", textAlign: "center", py: 3 }}
          >
            Nenhum comentário ainda. Seja o primeiro a comentar!
          </Typography>
        ) : (
          news.comments.map((comment) => (
          <Box 
            key={comment.id} 
            id={`comment-${comment.id}`}
            sx={{ 
              mb: 2,
              scrollMarginTop: "100px",
            }}
          >
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Avatar
                src={comment.user.profile_photo}
                onClick={() => handleUserClick(comment.user.id)}
                sx={{
                  width: 32,
                  height: 32,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
              >
                {comment.user.name[0]?.toUpperCase()}
              </Avatar>
              <Box flex={1}>
                <Paper
                  elevation={0}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    fontWeight={600}
                    fontSize={13}
                    onClick={() => handleUserClick(comment.user.id)}
                    sx={{
                      color: "#fff",
                      mb: 0.5,
                      cursor: "pointer",
                      transition: "opacity 0.2s",
                      "&:hover": {
                        opacity: 0.8,
                      },
                    }}
                  >
                    {comment.user.name}
                  </Typography>
                  <Typography
                    fontSize={14}
                    sx={{ 
                      color: "rgba(255,255,255,0.9)",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {comment.content}
                  </Typography>
                </Paper>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, ml: 1 }}>
                  <Typography
                    fontSize={11}
                    sx={{
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    {formatDate(comment.created_at)}
                  </Typography>
                  {/* Botões de ação */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => onLikeComment(comment.id)}
                      disabled={!isAuthenticated || likingComment[comment.id]}
                      sx={{
                        color: comment.likes.user_liked ? "#ff3040" : "rgba(255,255,255,0.5)",
                        padding: "4px",
                      }}
                    >
                      <FavoriteIcon fontSize="small" />
                    </IconButton>
                    {comment.likes.count > 0 && (
                      <Typography
                        fontSize={11}
                        onClick={() => handleLikesClick(comment.id, comment.likes.count)}
                        sx={{
                          color: "rgba(255,255,255,0.5)",
                          mr: 1,
                          cursor: "pointer",
                          transition: "opacity 0.2s",
                          "&:hover": {
                            opacity: 0.8,
                            textDecoration: "underline",
                          },
                        }}
                      >
                        {comment.likes.count}
                      </Typography>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => onStartReply(comment.id)}
                      disabled={!isAuthenticated}
                      sx={{
                        color: "rgba(255,255,255,0.5)",
                        padding: "4px",
                      }}
                    >
                      <ReplyIcon fontSize="small" />
                    </IconButton>
                    {comment.replies_count > 0 && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => onToggleReplies(comment.id)}
                          sx={{
                            color: "rgba(255,255,255,0.5)",
                            padding: "4px",
                          }}
                        >
                          {expandedComments.has(comment.id) ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                        </IconButton>
                        <Typography
                          fontSize={11}
                          sx={{ color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
                          onClick={() => onToggleReplies(comment.id)}
                        >
                          {comment.replies_count} {comment.replies_count === 1 ? "resposta" : "respostas"}
                        </Typography>
                      </>
                    )}
                    {/* Botão de excluir */}
                    {isAuthenticated && (isAdminMaster || isSubadmin || comment.user.id === currentUser?.id) && (
                      <IconButton
                        size="small"
                        onClick={() => onDeleteComment(comment.id, comment.content)}
                        sx={{
                          color: "rgba(255,255,255,0.5)",
                          padding: "4px",
                          ml: 0.5,
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                
                {/* Campo de resposta */}
                {replyingTo === comment.id && isAuthenticated && (
                  <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", mt: 1, ml: 4 }}>
                    <Avatar
                      src={currentUser?.profile_photo || undefined}
                      sx={{ width: 28, height: 28, mt: 0.5 }}
                    >
                      {currentUser?.name?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || "U"}
                    </Avatar>
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                        <TextField
                          fullWidth
                          placeholder="Escreva uma resposta..."
                          value={replyTexts[comment.id] || ""}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            if (newValue.length <= 500) {
                              onReplyTextChange(comment.id, newValue);
                            }
                          }}
                          onFocus={() => setFocusedReplyInput(comment.id)}
                          onBlur={() => setFocusedReplyInput(null)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              onReplySubmit(comment.id);
                            }
                          }}
                          multiline
                          minRows={1}
                          maxRows={3}
                          disabled={submittingReply[comment.id]}
                          size="small"
                          inputProps={{
                            maxLength: 500,
                          }}
                          helperText={`${(replyTexts[comment.id] || "").length}/500 caracteres`}
                          FormHelperTextProps={{
                            sx: {
                              color: "rgba(255,255,255,0.5)",
                              fontSize: "0.7rem",
                              mt: 0.5,
                              margin: 0,
                            },
                          }}
                          sx={{
                            flex: 1,
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "rgba(255,255,255,0.05)",
                              color: "#fff",
                              borderRadius: 2,
                              "& fieldset": {
                                borderColor: "rgba(255,255,255,0.1)",
                              },
                              "&:hover fieldset": {
                                borderColor: "rgba(255,255,255,0.2)",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "#ffc91f",
                              },
                            },
                            "& .MuiInputBase-input": {
                              color: "#fff",
                              fontSize: "13px",
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                              whiteSpace: "pre-wrap",
                              overflow: "hidden",
                              resize: "none",
                              "&::placeholder": {
                                color: "rgba(255,255,255,0.5)",
                                opacity: 1,
                              },
                            },
                            "& .MuiInputBase-inputMultiline": {
                              overflow: "hidden !important",
                              resize: "none",
                            },
                          }}
                        />
                        <IconButton
                          onClick={() => onReplySubmit(comment.id)}
                          disabled={!replyTexts[comment.id]?.trim() || submittingReply[comment.id]}
                          sx={{
                            color: focusedReplyInput === comment.id
                              ? "#ffc91f"
                              : "#fff !important",
                            alignSelf: "flex-start",
                            mt: "8px",
                            opacity: !replyTexts[comment.id]?.trim() && focusedReplyInput !== comment.id ? 0.5 : 1,
                            "&.Mui-disabled": {
                              color: focusedReplyInput === comment.id
                                ? "#ffc91f"
                                : "#fff !important",
                              opacity: !replyTexts[comment.id]?.trim() && focusedReplyInput !== comment.id ? 0.5 : 1,
                            },
                          }}
                        >
                          {submittingReply[comment.id] ? (
                            <CircularProgress size={16} sx={{ color: focusedReplyInput === comment.id ? "#ffc91f" : "#fff" }} />
                          ) : (
                            <SendIcon fontSize="small" sx={{ color: focusedReplyInput === comment.id ? "#ffc91f" : "#fff" }} />
                          )}
                        </IconButton>
                        <IconButton
                          onClick={() => onCancelReply(comment.id)}
                          sx={{ 
                            color: "rgba(255,255,255,0.5)",
                            alignSelf: "flex-start",
                            mt: "8px",
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Lista de respostas */}
                {expandedComments.has(comment.id) && (
                  <Box sx={{ mt: 1, ml: 4, borderLeft: "2px solid rgba(255,255,255,0.1)", pl: 2 }}>
                    {loadingReplies[comment.id] ? (
                      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                        <CircularProgress size={20} sx={{ color: "#ffc91f" }} />
                      </Box>
                    ) : (
                      <>
                        {(replies[comment.id] || [])
                          .filter((reply, index, self) => 
                            // Remove duplicatas baseado no ID
                            index === self.findIndex((r) => r.id === reply.id)
                          )
                          .map((reply) => (
                          <ReplyItem
                            key={`${comment.id}-${reply.id}`}
                            reply={reply}
                            isAuthenticated={isAuthenticated}
                            isAdminMaster={isAdminMaster}
                            isSubadmin={isSubadmin}
                            currentUserId={currentUser?.id}
                            onLike={() => onLikeComment(reply.id, comment.id)}
                            onDelete={() => onDeleteComment(reply.id, reply.content)}
                            liking={likingComment[reply.id] || false}
                          />
                        ))}
                        {(!replies[comment.id] || replies[comment.id].length === 0) && (
                          <Typography
                            fontSize={12}
                            sx={{ color: "rgba(255,255,255,0.5)", py: 1 }}
                          >
                            Nenhuma resposta ainda
                          </Typography>
                        )}
                        
                        {/* Botão para carregar mais respostas */}
                        {hasMoreReplies[comment.id] && (
                          <Box sx={{ display: "flex", justifyContent: "center", mt: 1.5, mb: 1 }}>
                            <Button
                              onClick={() => onLoadMoreReplies(comment.id)}
                              disabled={loadingMoreReplies[comment.id]}
                              variant="text"
                              size="small"
                              sx={{
                                color: "rgba(255,255,255,0.7)",
                                textTransform: "none",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                padding: "4px 12px",
                                minWidth: "auto",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  color: "#ffc91f",
                                  backgroundColor: "rgba(255,201,31,0.1)",
                                },
                                "&:disabled": {
                                  color: "rgba(255,255,255,0.3)",
                                },
                              }}
                            >
                              {loadingMoreReplies[comment.id] ? (
                                <>
                                  <CircularProgress size={12} sx={{ color: "#ffc91f", mr: 0.5 }} />
                                  Carregando...
                                </>
                              ) : (
                                `Ver mais respostas (${comment.replies_count - (repliesOffset[comment.id] || replies[comment.id]?.length || 0)} restantes)`
                              )}
                            </Button>
                          </Box>
                        )}
                      </>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
          ))
        )}
        
        {/* Botão para carregar mais comentários */}
        {hasMoreComments && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 2 }}>
            <Button
              onClick={onLoadMoreComments}
              disabled={loadingMoreComments}
              variant="outlined"
              sx={{
                color: "rgba(255,255,255,0.9)",
                borderColor: "rgba(255,255,255,0.3)",
                backgroundColor: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(5px)",
                textTransform: "none",
                fontSize: "0.875rem",
                fontWeight: 600,
                padding: "8px 24px",
                minWidth: "200px",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: "rgba(255,255,255,0.5)",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                },
                "&:disabled": {
                  color: "rgba(255,255,255,0.5)",
                  borderColor: "rgba(255,255,255,0.2)",
                  backgroundColor: "rgba(255,255,255,0.03)",
                },
              }}
            >
              {loadingMoreComments ? (
                <>
                  <CircularProgress size={16} sx={{ color: "#ffc91f", mr: 1 }} />
                  Carregando...
                </>
                    ) : (
                      `Carregar mais comentários`
                    )}
            </Button>
          </Box>
        )}
      </Box>

      {selectedUserId && (
        <UserProfileModal
          open={profileModalOpen}
          onClose={() => {
            setProfileModalOpen(false);
            setSelectedUserId(null);
          }}
          userId={selectedUserId}
        />
      )}

      {/* Modal de usuários que curtiram o comentário */}
      {selectedCommentId && (
        <UsersWhoLikedModal
          open={likesModalOpen}
          onClose={() => {
            setLikesModalOpen(false);
            setSelectedCommentId(null);
          }}
          type="comment"
          id={selectedCommentId}
          likesCount={news.comments.find(c => c.id === selectedCommentId)?.likes.count || 0}
        />
      )}
    </Box>
  );
}


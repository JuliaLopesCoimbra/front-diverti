"use client";

import React, { useState } from "react";
import { Box, Avatar, Typography, IconButton, Paper, TextField, CircularProgress, Button } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ReplyIcon from "@mui/icons-material/Reply";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import { CommentResponse } from "@/app/services/comments/commentService";
import { formatDate } from "@/app/utils/dateUtils";
import CommentInput from "./CommentInput";
import UserProfileModal from "@/app/components/user/UserProfileModal";

interface CommentItemProps {
  comment: CommentResponse;
  isExpanded: boolean;
  isReplying: boolean;
  replyText: string;
  replies: CommentResponse[];
  hasMoreReplies: boolean;
  loadingReplies: boolean;
  loadingMoreReplies: boolean;
  repliesOffset: number;
  isAuthenticated: boolean;
  isAdminMaster: boolean;
  isAdmin: boolean;
  currentUserId?: number;
  onLike: () => void;
  onReply: () => void;
  onToggleReplies: () => void;
  onReplyTextChange: (text: string) => void;
  onCancelReply: () => void;
  onDelete: () => void;
  onLoadMoreReplies: () => void;
}

export default function CommentItem({
  comment,
  isExpanded,
  isReplying,
  replyText,
  replies,
  hasMoreReplies,
  loadingReplies,
  loadingMoreReplies,
  repliesOffset,
  isAuthenticated,
  isAdminMaster,
  isAdmin,
  currentUserId,
  onLike,
  onReply,
  onToggleReplies,
  onReplyTextChange,
  onCancelReply,
  onDelete,
  onLoadMoreReplies,
}: CommentItemProps) {
  const canDelete = isAuthenticated && (isAdminMaster || isAdmin || comment.user.id === currentUserId);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const handleUserClick = (userId: number) => {
    setSelectedUserId(userId);
    setProfileModalOpen(true);
  };

  return (
    <Box sx={{ mb: 2 }}>
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
              sx={{ color: "rgba(255,255,255,0.9)" }}
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 1 }}>
              <IconButton
                size="small"
                onClick={onLike}
                disabled={!isAuthenticated}
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
                  sx={{ color: "rgba(255,255,255,0.5)", mr: 1 }}
                >
                  {comment.likes.count}
                </Typography>
              )}
              <IconButton
                size="small"
                onClick={onToggleReplies}
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
                    onClick={onToggleReplies}
                    sx={{
                      color: "rgba(255,255,255,0.5)",
                      padding: "4px",
                    }}
                  >
                    {isExpanded ? (
                      <ExpandLessIcon fontSize="small" />
                    ) : (
                      <ExpandMoreIcon fontSize="small" />
                    )}
                  </IconButton>
                  <Typography
                    fontSize={11}
                    sx={{ color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
                    onClick={onToggleReplies}
                  >
                    {comment.replies_count} {comment.replies_count === 1 ? "resposta" : "respostas"}
                  </Typography>
                </>
              )}
              {canDelete && (
                <IconButton
                  size="small"
                  onClick={onDelete}
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

          {isReplying && isAuthenticated && (
            <Box sx={{ mt: 1, ml: 4 }}>
              <CommentInput
                value={replyText}
                onChange={onReplyTextChange}
                onSubmit={onReply}
                placeholder="Escreva uma resposta..."
                submitting={false}
                userPhoto={undefined}
                userName={undefined}
                userEmail={undefined}
              />
            </Box>
          )}

          {isExpanded && (
            <Box sx={{ mt: 1, ml: 4, borderLeft: "2px solid rgba(255,255,255,0.1)", pl: 2 }}>
              {loadingReplies ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={20} sx={{ color: "#ffc91f" }} />
                </Box>
              ) : (
                <>
                  {replies.map((reply) => (
                    <Box key={reply.id} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Avatar
                          src={reply.user.profile_photo}
                          onClick={() => handleUserClick(reply.user.id)}
                          sx={{
                            width: 24,
                            height: 24,
                            cursor: "pointer",
                            transition: "opacity 0.2s",
                            "&:hover": {
                              opacity: 0.8,
                            },
                          }}
                        >
                          {reply.user.name[0]?.toUpperCase()}
                        </Avatar>
                        <Box flex={1}>
                          <Paper
                            elevation={0}
                            sx={{
                              backgroundColor: "rgba(255,255,255,0.03)",
                              p: 1,
                              borderRadius: 1.5,
                            }}
                          >
                            <Typography
                              fontWeight={600}
                              fontSize={12}
                              onClick={() => handleUserClick(reply.user.id)}
                              sx={{
                                color: "#fff",
                                mb: 0.3,
                                cursor: "pointer",
                                transition: "opacity 0.2s",
                                "&:hover": {
                                  opacity: 0.8,
                                },
                              }}
                            >
                              {reply.user.name}
                            </Typography>
                            <Typography
                              fontSize={13}
                              sx={{ color: "rgba(255,255,255,0.9)" }}
                            >
                              {reply.content}
                            </Typography>
                          </Paper>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.3, ml: 0.5 }}>
                            <Typography
                              fontSize={10}
                              sx={{ color: "rgba(255,255,255,0.4)" }}
                            >
                              {formatDate(reply.created_at)}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => {/* handleLikeReply */}}
                              disabled={!isAuthenticated}
                              sx={{
                                color: reply.likes.user_liked ? "#ff3040" : "rgba(255,255,255,0.4)",
                                padding: "2px",
                              }}
                            >
                              <FavoriteIcon fontSize="small" />
                            </IconButton>
                            {reply.likes.count > 0 && (
                              <Typography
                                fontSize={10}
                                sx={{ color: "rgba(255,255,255,0.4)" }}
                              >
                                {reply.likes.count}
                              </Typography>
                            )}
                            {isAuthenticated && (isAdminMaster || isAdmin || reply.user.id === currentUserId) && (
                              <IconButton
                                size="small"
                                onClick={() => {/* handleDeleteReply */}}
                                sx={{
                                  color: "rgba(255,255,255,0.4)",
                                  padding: "2px",
                                  ml: 0.5,
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                  {replies.length === 0 && (
                    <Typography
                      fontSize={12}
                      sx={{ color: "rgba(255,255,255,0.5)", py: 1 }}
                    >
                      Nenhuma resposta ainda
                    </Typography>
                  )}

                  {hasMoreReplies && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 1.5, mb: 1 }}>
                      <Button
                        onClick={onLoadMoreReplies}
                        disabled={loadingMoreReplies}
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
                        {loadingMoreReplies ? (
                          <>
                            <CircularProgress size={12} sx={{ color: "#ffc91f", mr: 0.5 }} />
                            Carregando...
                          </>
                        ) : (
                          `Ver mais respostas (${comment.replies_count - repliesOffset} restantes)`
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
    </Box>
  );
}


